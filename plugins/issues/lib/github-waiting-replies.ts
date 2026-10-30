import { connection, json, type Runner } from "./gh.ts";
import { normalizeRepository } from "./github-target.ts";
import { parseFenceOpener, closesFence, type MarkdownFence } from "./markdown-fence.ts";
type Comment = { id: string; author: string; body: string; createdAt: string; url: string; human: boolean; minimized?: boolean };
type Thread = { resolved: boolean; comments: Comment[] };
type Signal = { reason: string; url?: string; since?: string; urgent: boolean };
function visible(body: string) {
  let fence: MarkdownFence | undefined;
  return body.split(/\r?\n/).filter(line => {
    // Preserve the former (.*)$ suffix check, which rejects line terminators.
    const marker = /[\r\n\u2028\u2029]/.test(line) ? null : parseFenceOpener(line);
    if (fence) {
      if (marker && closesFence(line, fence)) fence = undefined;
      return false;
    }
    if (marker) { fence = marker; return false; }
    return !/^\s*>/.test(line);
  }).join("\n").replace(/(`+)[^]*?\1/g, "");
}
export function waitingSignals(item: { author: string; comments: Comment[]; reviewRequested?: boolean; threads: Thread[] }, user: string): Signal[] {
  const result: Signal[] = [], login = user.toLowerCase();
  const latest = (comments: Comment[]) => comments.filter(c => c.human && !c.minimized).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)).at(-1);
  const external = (comment: Comment | undefined) => comment && comment.author.toLowerCase() !== login;
  const signal = (reason: string, comment?: Comment): Signal => ({ reason, url: comment?.url, since: comment?.createdAt, urgent: /\b(?:urgent|asap|blocking|blocked)\b/i.test(visible(comment?.body ?? "")) });
  if (item.reviewRequested) result.push(signal("review-request"));
  const comment = latest(item.comments);
  if (external(comment)) {
    const text = visible(comment!.body), escaped = user.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^\\w])@${escaped}(?![\\w-])`, "i").test(text)) result.push(signal("mention", comment));
    if (item.author.toLowerCase() === login && /\b(?:confirm|decide|decision|approve|which|can you|could you|please review)\b/i.test(text)) result.push(signal("decision", comment));
  }
  for (const thread of item.threads) if (!thread.resolved && external(latest(thread.comments))) result.push(signal("thread", latest(thread.comments)));
  return result;
}
async function restPages(gh: Runner, path: string) {
  const result: any[] = [];
  for (let page = 1; page <= 50; page++) {
    const rows = json(await gh(["api", `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`]));
    if (!Array.isArray(rows)) throw new Error("Incomplete REST page");
    result.push(...rows); if (rows.length < 100) return result;
  }
  throw new Error("REST pagination limit reached");
}
function restComment(row: any): Comment {
  return { id: String(row.id), author: row.user?.login ?? "", body: row.body ?? "", createdAt: row.created_at, url: row.html_url, human: row.user?.type === "User" && !/\[bot\]$|^(?:ghost|mannequin)$/i.test(row.user.login) };
}
export async function scanWaitingReplies(options: { repositories: string[]; user: string }, gh: Runner) {
  if (!options.user || !options.repositories.length) throw new Error("User and repository scope are required");
  const items: any[] = [], errors: string[] = [];
  for (const repository of [...new Set(options.repositories.map(normalizeRepository))]) {
    try {
      const [owner, name] = repository.split("/");
      const open = await restPages(gh, `repos/${repository}/issues?state=open`);
      for (const item of open) {
        const comments = (await restPages(gh, `repos/${repository}/issues/${item.number}/comments`)).map(restComment);
        let threads: Thread[] = [], reviewRequested = false;
        if (item.pull_request) {
          const pull = json(await gh(["api", `repos/${repository}/pulls/${item.number}`]));
          reviewRequested = pull.requested_reviewers?.some((actor: any) => actor.login?.toLowerCase() === options.user.toLowerCase()) ?? false;
          const rows = await connection(gh, `query($owner:String!,$name:String!,$number:Int!,$after:String){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100,after:$after){nodes{id isResolved comments(first:100){nodes{id body createdAt url isMinimized author{login __typename}} pageInfo{hasNextPage endCursor}}} pageInfo{hasNextPage endCursor}}}}}`, { owner, name, number: item.number }, data => data.repository?.pullRequest?.reviewThreads);
          for (const row of rows) {
            let entries = row.comments?.nodes;
            if (!Array.isArray(entries) || typeof row.isResolved !== "boolean" || typeof row.comments?.pageInfo?.hasNextPage !== "boolean") throw new Error("Incomplete review thread");
            if (row.comments.pageInfo.hasNextPage) entries = await connection(gh, `query($id:ID!,$after:String){node(id:$id){... on PullRequestReviewThread{comments(first:100,after:$after){nodes{id body createdAt url isMinimized author{login __typename}} pageInfo{hasNextPage endCursor}}}}}`, { id: row.id }, data => data.node?.comments);
            threads.push({ resolved: row.isResolved, comments: entries.map((c: any) => ({ id: c.id, body: c.body, createdAt: c.createdAt, url: c.url, author: c.author?.login ?? "", minimized: c.isMinimized, human: c.author?.__typename === "User" && !/^(?:ghost|mannequin)$/i.test(c.author.login) })) });
          }
        }
        const current = json(await gh(["api", `repos/${repository}/issues/${item.number}`]));
        if (current.state !== "open") continue;
        const reasons = waitingSignals({ author: current.user?.login ?? item.user?.login ?? "", comments, threads, reviewRequested }, options.user);
        if (reasons.length) items.push({ repository, number: item.number, title: current.title, url: current.html_url, reasons });
      }
    } catch { errors.push(`${repository}: scan incomplete; access, pagination, or a live read failed`); }
  }
  const oldest = (item: { reasons: Signal[] }) => item.reasons.flatMap(reason => reason.since ? [reason.since] : []).sort()[0] ?? "";
  items.sort((a, b) => Number(b.reasons.some((r: Signal) => r.urgent)) - Number(a.reasons.some((r: Signal) => r.urgent)) || oldest(a).localeCompare(oldest(b)) || a.repository.localeCompare(b.repository) || a.number - b.number);
  return { complete: !errors.length, items, errors };
}
