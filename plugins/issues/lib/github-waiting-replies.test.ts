import { expect, test } from "bun:test";
import { waitingSignals, scanWaitingReplies } from "./github-waiting-replies.ts";
const comment = { id: "1", author: "other", createdAt: "2026-01-01T00:00:00Z", url: "https://example.com/comment", body: "@reviewer could you confirm?", human: true };
test("ignores quotes, bots, stale pings and resolved threads", () => {
  expect(waitingSignals({ author: "reviewer", comments: [comment], reviewRequested: false, threads: [] }, "reviewer")[0].reason).toBe("mention");
  for (const comments of [[{ ...comment, body: "> @reviewer\n```\n@reviewer\n```" }], [{ ...comment, human: false }], [comment, { ...comment, id: "2", author: "reviewer", createdAt: "2026-01-02T00:00:00Z" }]]) expect(waitingSignals({ author: "other", comments, threads: [] }, "reviewer")).toEqual([]);
  expect(waitingSignals({ author: "other", comments: [{ ...comment, body: "```md\n@reviewer" }], threads: [] }, "reviewer")).toEqual([]);
  expect(waitingSignals({ author: "other", comments: [], threads: [{ resolved: true, comments: [comment] }] }, "reviewer")).toEqual([]);
});
test("hydrates PR threads through every nested comment page", async () => {
  let commentPages = 0;
  const result = await scanWaitingReplies({ repositories: ["sample/widgets"], user: "reviewer" }, async (args, options) => {
    const path = args[1];
    if (path.includes("/issues?")) return '[{"number":1,"state":"open","pull_request":{}}]';
    if (path.includes("/comments?")) return "[]";
    if (path.includes("/pulls/")) return '{"requested_reviewers":[{"login":"reviewer"}]}';
    if (path === "graphql") {
      const query = JSON.parse(options!.stdin!).query;
      const entry = { id: String(commentPages), author: { login: "other", __typename: "User" }, body: "A decision is needed.", createdAt: comment.createdAt, url: comment.url };
      if (query.includes("reviewThreads")) return JSON.stringify({ data: { repository: { pullRequest: { reviewThreads: { nodes: [{ id: "T", isResolved: false, comments: { nodes: [], pageInfo: { hasNextPage: true } } }], pageInfo: { hasNextPage: false } } } } } });
      return JSON.stringify({ data: { node: { comments: { nodes: [entry], pageInfo: { hasNextPage: ++commentPages === 1, endCursor: "next" } } } } });
    }
    return '{"state":"open","title":"Change","html_url":"https://example.com/pr","user":{"login":"other"}}';
  });
  expect(result.complete).toBe(true); expect(commentPages).toBe(2); expect(result.items[0].reasons.map((s: any) => s.reason)).toEqual(["review-request", "thread"]);
});
test("keeps independent reasons and ranks explicit urgency", () => {
  const signals = waitingSignals({ author: "reviewer", comments: [{ ...comment, body: "@reviewer urgent: please decide" }], reviewRequested: true, threads: [{ resolved: false, comments: [comment] }] }, "reviewer");
  expect(signals.map(s => s.reason)).toEqual(["review-request", "mention", "decision", "thread"]); expect(signals.some(s => s.urgent)).toBe(true);
});
test("scans all repository pages and fails visibly without claiming an all-clear", async () => {
  let pages = 0;
  const result = await scanWaitingReplies({ repositories: ["sample/widgets"], user: "reviewer" }, async args => {
    if (args[1].includes("/issues?")) { pages++; return pages === 1 ? JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ number: i + 1, state: "open" }))) : "[]"; }
    if (args[1].includes("/comments?")) return "[]";
    return '{"state":"closed"}';
  });
  expect(pages).toBe(2); expect(result.complete).toBe(true); expect(result.items).toEqual([]);
  const failed = await scanWaitingReplies({ repositories: ["sample/widgets"], user: "reviewer" }, async () => { throw Error("no access"); });
  expect(failed.complete).toBe(false); expect(failed.errors).toHaveLength(1);
});
test("orders by the oldest pending signal across mentions and threads", async () => {
  const result = await scanWaitingReplies({ repositories: ["sample/widgets"], user: "reviewer" }, async (args, options) => {
    const path = args[1];
    if (path.includes("/issues?")) return '[{"number":1,"pull_request":{}},{"number":2}]';
    if (path.includes("/comments?")) return JSON.stringify([{ id: 1, user: { type: "User", login: "other" }, body: "@reviewer", created_at: path.includes("/1/") ? "2026-01-03T00:00:00Z" : "2026-01-02T00:00:00Z", html_url: comment.url }]);
    if (path.includes("/pulls/")) return '{"requested_reviewers":[]}';
    if (path === "graphql") return JSON.stringify({ data: { repository: { pullRequest: { reviewThreads: { nodes: [{ id: "T", isResolved: false, comments: { nodes: [{ id: "C", author: { login: "other", __typename: "User" }, body: "Waiting", createdAt: comment.createdAt, url: comment.url }], pageInfo: { hasNextPage: false } } }], pageInfo: { hasNextPage: false } } } } } });
    return '{"state":"open","user":{"login":"other"}}';
  });
  expect(result.complete).toBe(true);
  expect(result.items.map(item => item.number)).toEqual([1, 2]);
});
