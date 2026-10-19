import { expect, test } from "bun:test";
import { setIssueType } from "./set-issue-type.ts";
const view = { id: "I", number: 1, url: "https://github.com/sample/widgets/issues/1", issueType: null };
const gh = (replies: unknown[]) => async () => JSON.stringify(replies.shift());
test("queries the repository owner's native type catalog", async () => {
  let calls = 0;
  await setIssueType({ repository: "sample/widgets", issue: "1", type: "Defect" }, async (_args, options) => {
    if (++calls === 1) return JSON.stringify(view);
    expect(JSON.parse(options!.stdin!).query).toContain("organization(login:$owner)");
    return '{"data":{"organization":{"issueTypes":{"nodes":[],"pageInfo":{"hasNextPage":false}}}}}';
  });
});
test("missing native types degrade without inventing labels", async () => {
  const result = await setIssueType({ repository: "sample/widgets", issue: "1", type: "Defect" }, gh([view, { data: { organization: { issueTypes: { nodes: [], pageInfo: { hasNextPage: false } } } } }]));
  expect(result.action).toBe("unavailable"); expect(result.message).toContain("plain issue");
});
test("preserves existing types during backfill", async () => {
  expect((await setIssueType({ repository: "sample/widgets", issue: "1", type: "Defect", ifMissing: true }, gh([{ ...view, issueType: { name: "Existing" } }]))).action).toBe("preserved");
});
test("previews by default and writes only with authority, requiring readback", async () => {
  const replies = [view, { data: { organization: { issueTypes: { nodes: [{ id: "T", name: "Defect" }], pageInfo: { hasNextPage: false } } } } }];
  const options = { repository: "sample/widgets", issue: "1", type: "Defect" };
  expect((await setIssueType(options, gh([...replies]))).action).toBe("preview");
  expect((await setIssueType({ ...options, authorized: true }, gh([...replies, { data: { updateIssueIssueType: { issue: { id: "I", issueType: { name: "Defect" } } } } }, { ...view, issueType: { name: "Defect" } }]))).action).toBe("set");
  await expect(setIssueType({ ...options, authorized: true }, gh([...replies, { errors: [{}] }]))).rejects.toThrow();
});
