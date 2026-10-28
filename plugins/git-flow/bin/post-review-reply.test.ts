import { afterEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runReply, type GhRunner } from "./post-review-reply.ts";

const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
const body = "Fixed in `abc123`.\nLiteral $(touch nope), 'quotes', and $VARIABLE stay in the body.";
const reply = { threadId: "PRRT_example", rootCommentDatabaseId: 9, body, ignored: "extra metadata" };
const details = { replyId: 10, replyUrl: "https://github.com/a/b/pull/1#discussion_r10", resolved: false };
const created = { id: details.replyId, html_url: details.replyUrl };
const confirmed = { ...created, body, in_reply_to_id: 9 };
const thread = { id: reply.threadId, isResolved: false, comments: { nodes: [{ databaseId: 9 }] } };
function page(nodes: unknown[] = [thread], hasNextPage = false, endCursor: string | null = null) {
  return { data: { repository: { pullRequest: { reviewThreads: { nodes, pageInfo: { hasNextPage, endCursor } } } } } };
}
function fixture(payload: unknown = { replies: [reply] }) {
  const directory = mkdtempSync(join(tmpdir(), "post-review-reply-test-")); temporary.push(directory);
  const file = join(directory, "payload.json"); writeFileSync(file, JSON.stringify(payload) + "\n");
  const digest = createHash("sha256").update(readFileSync(file)).digest("hex");
  return { file, args: ["--repo", "a/b", "--pr", "1", "--payload", file, "--thread-id", reply.threadId, "--root-comment-id", "9", "--sha256", digest] };
}
function fake(...responses: unknown[]) {
  const calls: { args: string[]; input?: string; file?: string; mode?: number }[] = [];
  const gh: GhRunner = async (args, input) => {
    const path = args[args.indexOf("--input") + 1];
    calls.push({ args, input, ...(args.includes("--input") && path !== "-" ? { file: readFileSync(path!, "utf8"), mode: statSync(path!).mode & 0o777 } : {}) });
    if (!responses.length) throw new Error("unexpected gh call");
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return typeof response === "string" ? response : JSON.stringify(response);
  };
  return { gh, calls, writes: () => calls.filter(c => c.args.includes("POST") || c.input?.includes("mutation")) };
}
async function refuses(args: string[], responses: unknown[], reason: RegExp) {
  const f = fake(...responses), result = await runReply(args, f.gh);
  expect(result.exitCode).not.toBe(0); expect(result.error).toMatch(reason);
  expect(result.reply).toBeUndefined(); expect(f.writes()).toEqual([]);
  return f;
}

test("digest mismatch rejects even a whitespace-only change before any gh call", async () => {
  const { file, args } = fixture(); writeFileSync(file, readFileSync(file, "utf8") + " ");
  expect((await refuses(args, [], /digest/i)).calls).toEqual([]);
});
test("requires exactly one reply matching both IDs", async () => {
  for (const replies of [[], [{ ...reply, threadId: "other" }], [{ ...reply, rootCommentDatabaseId: 8 }], [reply, reply]]) {
    expect((await refuses(fixture({ replies }).args, [], /exactly one/i)).calls).toEqual([]);
  }
});
test("rejects empty, whitespace and non-string bodies", async () => {
  for (const value of ["", " \n\t", null, 42]) await refuses(fixture({ replies: [{ ...reply, body: value }] }).args, [], /body/i);
});
test("rejects malformed payloads without gh calls", async () => {
  for (const value of [null, [], {}, { replies: {} }, { replies: [null] }]) {
    expect((await refuses(fixture(value).args, [], /payload/i)).calls).toEqual([]);
  }
  const { file, args } = fixture(); writeFileSync(file, "{"); args[args.length - 1] = createHash("sha256").update("{").digest("hex");
  await refuses(args, [], /JSON/i);
});
test("validates every required flag, rejects duplicates, unknown flags and unsafe values", async () => {
  const { args } = fixture();
  for (let i = 0; i < args.length; i += 2) await refuses([...args.slice(0, i), ...args.slice(i + 2)], [], /arguments|usage/i);
  for (const extra of [["--other"], ["--resolve", "--resolve"], ["--repo", "a/b"], ["--resolve=true"]]) await refuses([...args, ...extra], [], /arguments|usage/i);
  for (const [flag, value] of [["--repo", "../b"], ["--repo", "a/b/c"], ["--repo", "a/b?x"], ["--pr", "0"], ["--pr", "1x"], ["--pr", "9007199254740992"], ["--root-comment-id", "-1"], ["--root-comment-id", "1.5"], ["--thread-id", "bad\nnode"], ["--thread-id", ""], ["--sha256", "bad"]]) {
    const invalid = [...args]; invalid[invalid.indexOf(flag!) + 1] = value!; await refuses(invalid, [], /arguments|usage/i);
  }
});
test("missing, resolved or mismatched-root threads post nothing", async () => {
  await refuses(fixture().args, [page([])], /thread.*missing/i);
  await refuses(fixture().args, [page([{ ...thread, isResolved: true }])], /resolved/i);
  await refuses(fixture().args, [page([{ ...thread, comments: { nodes: [{ databaseId: 8 }] } }])], /root/i);
});
test("failed or partial later pages prevent posting even after finding the thread", async () => {
  for (const response of [new Error("page failed"), { ...page([]), errors: [{ message: "partial page" }] }, { data: { repository: null } }, "not JSON"]) {
    const f = await refuses(fixture().args, [page([thread], true, "cursor-1"), response], /page|GraphQL|JSON/i);
    expect(f.calls).toHaveLength(2);
  }
});
test("malformed pages and stalled pagination fail closed", async () => {
  for (const response of [page([{ ...thread, isResolved: null }]), page([{ ...thread, comments: { nodes: [] } }]), page([thread], true, null), { data: { repository: { pullRequest: { reviewThreads: { nodes: [thread] } } } } }]) {
    await refuses(fixture().args, [response], /page|pagination/i);
  }
  await refuses(fixture().args, [page([thread], true, "same"), page([], true, "same")], /pagination/i);
  await refuses(fixture().args, [page([thread], true, "next"), page([thread])], /thread|duplicate/i);
});
test("paginates completely, posts only the chosen body in a private temp file and reads it back", async () => {
  const { args } = fixture({ replies: [{ ...reply, threadId: "unselected" }, reply] });
  const f = fake(page([{ ...thread, id: "other-thread" }], true, "cursor-1"), page(), created, confirmed);
  expect(await runReply(args, f.gh)).toEqual({ exitCode: 0, reply: details });
  expect(f.calls).toHaveLength(4);
  for (const [index, cursor] of [[0, null], [1, "cursor-1"]] as const) {
    const call = f.calls[index]!; expect(call.args).toEqual(["api", "graphql", "--input", "-"]);
    const request = JSON.parse(call.input!);
    expect(request.variables).toEqual({ owner: "a", name: "b", number: 1, cursor });
    expect(request.query).toContain("reviewThreads(first: 100, after: $cursor)");
    expect(request.query).toContain("comments(first: 1)");
  }
  const post = f.calls[2]!;
  expect(post.args.slice(0, 5)).toEqual(["api", "-X", "POST", "repos/a/b/pulls/1/comments/9/replies", "--input"]);
  expect(JSON.parse(post.file!)).toEqual({ body }); expect(post.mode).toBe(0o600);
  expect(existsSync(post.args[5]!)).toBe(false);
  expect(f.calls[3]!.args).toEqual(["api", "repos/a/b/pulls/comments/10"]);
  expect(f.calls.every(c => c.args.every(a => !a.includes(body)))).toBe(true);
});
test("resolves only after confirmed read-back using a GraphQL variable", async () => {
  const f = fake(page(), created, confirmed, { data: { resolveReviewThread: { thread: { id: reply.threadId, isResolved: true } } } });
  expect(await runReply([...fixture().args, "--resolve"], f.gh)).toEqual({ exitCode: 0, reply: { ...details, resolved: true } });
  const request = JSON.parse(f.calls[3]!.input!);
  expect(request.query).toContain("resolveReviewThread"); expect(request.query).not.toContain(reply.threadId);
  expect(request.variables).toEqual({ threadId: reply.threadId });
});
test("read-back mismatch or failure never resolves and reports the posted reply", async () => {
  for (const response of [{ ...confirmed, body: "different" }, { ...confirmed, in_reply_to_id: 8 }, { ...confirmed, id: 11 }, new Error("read-back failed"), "not JSON"]) {
    const f = fake(page(), created, response), result = await runReply([...fixture().args, "--resolve"], f.gh);
    expect(result.exitCode).not.toBe(0); expect(result.error).toMatch(/read.back/i);
    expect(result.reply).toEqual(details); expect(f.calls).toHaveLength(3);
    expect(result.error?.endsWith("; check the PR before retrying")).toBe(true);
  }
});
test("resolve failures retain reply details and exit nonzero", async () => {
  for (const response of [new Error("resolve failed"), { data: { resolveReviewThread: { thread: { id: reply.threadId, isResolved: false } } } }, { data: { resolveReviewThread: { thread: { id: "other", isResolved: true } } } }, { data: null, errors: [{ message: "denied" }] }, "not JSON"]) {
    const f = fake(page(), created, confirmed, response), result = await runReply([...fixture().args, "--resolve"], f.gh);
    expect(result.exitCode).not.toBe(0); expect(result.error).toMatch(/resolv/i); expect(result.reply).toEqual(details);
    expect(f.calls).toHaveLength(4);
    expect(result.error?.endsWith("; check the PR before retrying")).toBe(true);
  }
});
test("post failure never reads back or resolves and removes its temp file", async () => {
  const f = fake(page(), new Error("post failed")), result = await runReply([...fixture().args, "--resolve"], f.gh);
  expect(result.exitCode).not.toBe(0); expect(result.error).toMatch(/post/i); expect(f.calls).toHaveLength(2);
  expect(existsSync(f.calls[1]!.args[5]!)).toBe(false);
});
test("a throwing gh POST warns to check the PR before retrying", async () => {
  const f = fake(page(), new Error("Command deadline exceeded"));
  const result = await runReply(fixture().args, f.gh);
  expect(result.exitCode).toBe(1);
  expect(result.error).toBe("post reply: Command deadline exceeded; check the PR before retrying");
});
test("a throwing read-back retains the reply and warns to check the PR before retrying", async () => {
  const f = fake(page(), created, new Error("gh failed"));
  const result = await runReply(fixture().args, f.gh);
  expect(result.exitCode).toBe(1); expect(result.reply).toEqual(details);
  expect(result.error).toBe("read-back reply: gh failed; check the PR before retrying");
});
test("a thread-check failure does not warn about a potentially posted reply", async () => {
  const f = fake(new Error("thread check failed"));
  const result = await runReply(fixture().args, f.gh);
  expect(result.exitCode).toBe(1); expect(result.reply).toBeUndefined();
  expect(result.error).toBe("review-thread page: thread check failed");
  expect(f.writes()).toEqual([]);
});
test("malformed POST responses warn exactly once, including JSON parse errors", async () => {
  for (const response of ["not JSON", {}]) {
    const f = fake(page(), response), result = await runReply(fixture().args, f.gh);
    expect(result.exitCode).toBe(1);
    expect(result.error?.endsWith("; check the PR before retrying")).toBe(true);
    expect(result.error?.split("; check the PR before retrying")).toHaveLength(2);
  }
});
test("CLI invalid arguments emit only a stderr reason and exit nonzero without gh", () => {
  const result = Bun.spawnSync([process.execPath, resolve(import.meta.dir, "post-review-reply.ts")], { env: { PATH: "/nonexistent" } });
  expect(result.exitCode).not.toBe(0); expect(result.stdout.toString()).toBe(""); expect(result.stderr.toString()).toContain("post-review-reply:");
});
