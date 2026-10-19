import { expect, test } from "bun:test";
import { listGitHubParentProjectChildren, readHierarchy, buildHierarchyMutation } from "./github-parent-project.ts";
test("lists native children in order across every page", async () => {
  let calls = 0;
  const result = await listGitHubParentProjectChildren(async () => JSON.stringify({ data: { node: { subIssues: { nodes: [{ id: String(++calls), number: calls, title: "Child", url: `https://github.com/sample/widgets/issues/${calls}` }], pageInfo: { hasNextPage: calls === 1, endCursor: "next" } } } } }), "p");
  expect(result.map(c => c.id)).toEqual(["1", "2"]);
});
test("distinguishes no parent from malformed hierarchy", async () => {
  expect(await readHierarchy(async () => '{"data":{"node":{"parent":null,"subIssues":{"totalCount":0}}}}', "a")).toEqual({ parentId: null, childCount: 0 });
  await expect(readHierarchy(async () => '{"data":{"node":{}}}', "a")).rejects.toThrow();
});
test("builds native hierarchy writes with typed variables and exact anchors", () => {
  expect(buildHierarchyMutation({ operation: "attach", parentId: "p", childId: "c" }).variables.input).toEqual({ issueId: "p", subIssueId: "c" });
  expect(buildHierarchyMutation({ operation: "reorder", parentId: "p", childId: "c", beforeId: "a" }).variables.input.beforeId).toBe("a");
  expect(() => buildHierarchyMutation({ operation: "reorder", parentId: "p", childId: "c" })).toThrow();
});
