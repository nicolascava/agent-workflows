#!/usr/bin/env bun
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBounded } from "../lib/bounded-command";
import { isRecord } from "../lib/is-record";

export type GhRunner = (args: string[], input?: string) => Promise<string>;
export interface ReplyResult { replyId: number; replyUrl: string; resolved: boolean }
export interface ReplyOutcome { exitCode: number; reply?: ReplyResult; error?: string }
interface Options { repo: string; pr: number; payload: string; threadId: string; rootId: number; sha256: string; resolve: boolean }

const threadsQuery = `query($owner: String!, $name: String!, $number: Int!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 100, after: $cursor) {
        nodes { id isResolved comments(first: 1) { nodes { databaseId } } }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
}`;
const resolveQuery = `mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) { thread { id isResolved } }
}`;
const positiveId = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value > 0;

export function parseArguments(args: string[]): Options {
  const values = new Map<string, string>(); let resolve = false;
  const flags = ["--repo", "--pr", "--payload", "--thread-id", "--root-comment-id", "--sha256"];
  for (let i = 0; i < args.length; i++) {
    const flag = args[i]!;
    if (flag === "--resolve" && !resolve) { resolve = true; continue; }
    if (!flags.includes(flag) || values.has(flag) || !args[i + 1] || args[i + 1]!.startsWith("--")) throw new Error("invalid arguments");
    values.set(flag, args[++i]!);
  }
  if (flags.some(flag => !values.has(flag))) throw new Error("usage: post-review-reply.ts --repo <owner/name> --pr <number> --payload <file> --thread-id <node-id> --root-comment-id <id> --sha256 <digest> [--resolve]");
  const repo = values.get("--repo")!, pr = values.get("--pr")!, rootId = values.get("--root-comment-id")!;
  const threadId = values.get("--thread-id")!, sha256 = values.get("--sha256")!;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9_.-]+$/.test(repo) || [".", ".."].includes(repo.split("/")[1]!) ||
      !/^[1-9][0-9]*$/.test(pr) || !positiveId(Number(pr)) || Number(pr) > 2147483647 ||
      !/^[1-9][0-9]*$/.test(rootId) || !positiveId(Number(rootId)) ||
      !/^[A-Za-z0-9_+/=-]+$/.test(threadId) || !/^[a-f0-9]{64}$/i.test(sha256)) throw new Error("invalid arguments");
  return { repo, pr: Number(pr), payload: values.get("--payload")!, threadId, rootId: Number(rootId), sha256: sha256.toLowerCase(), resolve };
}

function approvedBody(options: Options): string {
  if (!statSync(options.payload).isFile()) throw new Error("payload must be a regular file");
  const bytes = readFileSync(options.payload);
  if (createHash("sha256").update(bytes).digest("hex") !== options.sha256) throw new Error("payload digest mismatch");
  const payload: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!isRecord(payload) || !Array.isArray(payload.replies) || payload.replies.some(r => !isRecord(r))) throw new Error("invalid payload: expected replies array");
  const matches = payload.replies.filter(r => r.threadId === options.threadId && r.rootCommentDatabaseId === options.rootId);
  if (matches.length !== 1) throw new Error("payload must contain exactly one reply matching both IDs");
  const body = matches[0]!.body;
  if (typeof body !== "string" || !body.trim()) throw new Error("reply body must be a non-empty string");
  return body;
}

async function graphql(gh: GhRunner, query: string, variables: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response: unknown = JSON.parse(await gh(["api", "graphql", "--input", "-"], JSON.stringify({ query, variables })));
  if (!isRecord(response) || (response.errors !== undefined && (!Array.isArray(response.errors) || response.errors.length > 0)) || !isRecord(response.data)) throw new Error("GraphQL request failed or returned partial data");
  return response.data;
}

async function checkThread(options: Options, gh: GhRunner) {
  const [owner, name] = options.repo.split("/");
  let cursor: string | null = null;
  const cursors = new Set<string>(), ids = new Set<string>();
  let target: { rootId: number; resolved: boolean } | undefined;
  do {
    const data = await graphql(gh, threadsQuery, { owner, name, number: options.pr, cursor });
    const pr = isRecord(data.repository) ? data.repository.pullRequest : undefined;
    const connection = isRecord(pr) ? pr.reviewThreads : undefined;
    if (!isRecord(connection) || !Array.isArray(connection.nodes) || !isRecord(connection.pageInfo)) throw new Error("incomplete review-thread page");
    const info = connection.pageInfo;
    if (typeof info.hasNextPage !== "boolean" || !(info.endCursor === null || typeof info.endCursor === "string")) throw new Error("incomplete pagination page");
    for (const node of connection.nodes) {
      if (!isRecord(node) || typeof node.id !== "string" || !node.id || typeof node.isResolved !== "boolean" || !isRecord(node.comments) || !Array.isArray(node.comments.nodes) || node.comments.nodes.length !== 1) throw new Error("incomplete review-thread page");
      const first = node.comments.nodes[0];
      if (!isRecord(first) || !positiveId(first.databaseId)) throw new Error("incomplete root comment on review-thread page");
      if (ids.has(node.id)) throw new Error("duplicate review thread across pages");
      ids.add(node.id);
      if (node.id === options.threadId) target = { rootId: first.databaseId, resolved: node.isResolved };
    }
    if (!info.hasNextPage) break;
    if (typeof info.endCursor !== "string" || !info.endCursor || cursors.has(info.endCursor) || !connection.nodes.length) throw new Error("invalid review-thread pagination");
    cursor = info.endCursor; cursors.add(cursor);
  } while (true);
  if (!target) throw new Error("review thread missing from this repository/PR");
  if (target.resolved) throw new Error("review thread is already resolved");
  if (target.rootId !== options.rootId) throw new Error("review thread root comment mismatch");
}

const ghRunner: GhRunner = (args, input) => runBounded(["gh", ...args], { timeout: 30_000, input });

export async function runReply(args: string[], gh: GhRunner = ghRunner): Promise<ReplyOutcome> {
  let reply: ReplyResult | undefined, stage = "arguments";
  try {
    const options = parseArguments(args);
    stage = "payload"; const body = approvedBody(options);
    stage = "review-thread page"; await checkThread(options, gh);
    stage = "post reply";
    const directory = mkdtempSync(join(tmpdir(), "post-review-reply-"));
    let posted: unknown;
    try {
      const path = join(directory, "reply.json");
      writeFileSync(path, JSON.stringify({ body }), { mode: 0o600 });
      posted = JSON.parse(await gh(["api", "-X", "POST", `repos/${options.repo}/pulls/${options.pr}/comments/${options.rootId}/replies`, "--input", path]));
    } finally { rmSync(directory, { recursive: true, force: true }); }
    if (!isRecord(posted) || !positiveId(posted.id) || typeof posted.html_url !== "string" || !/^https:\/\/\S+$/.test(posted.html_url)) throw new Error("invalid created reply response; check the PR before retrying");
    reply = { replyId: posted.id, replyUrl: posted.html_url, resolved: false };
    stage = "read-back reply";
    const readBack: unknown = JSON.parse(await gh(["api", `repos/${options.repo}/pulls/comments/${reply.replyId}`]));
    if (!isRecord(readBack) || readBack.id !== reply.replyId || readBack.body !== body || readBack.in_reply_to_id !== options.rootId) throw new Error("created reply does not match approved body and root");
    if (options.resolve) {
      stage = "resolve thread";
      const data = await graphql(gh, resolveQuery, { threadId: options.threadId });
      const resolved = isRecord(data.resolveReviewThread) ? data.resolveReviewThread.thread : undefined;
      if (!isRecord(resolved) || resolved.id !== options.threadId || resolved.isResolved !== true) throw new Error("thread resolution was not confirmed");
      reply.resolved = true;
    }
    return { exitCode: 0, reply };
  } catch (error) {
    const suffix = "; check the PR before retrying";
    let reason = error instanceof Error ? error.message : "invalid input";
    if (["post reply", "read-back reply", "resolve thread"].includes(stage) && !reason.endsWith(suffix)) reason += suffix;
    return { exitCode: 1, ...(reply ? { reply } : {}), error: `${stage}: ${reason}` };
  }
}

if (import.meta.main) {
  const outcome = await runReply(process.argv.slice(2));
  if (outcome.reply) console.log(JSON.stringify(outcome.reply));
  if (outcome.error) console.error(`post-review-reply: ${outcome.error}`);
  process.exitCode = outcome.exitCode;
}
