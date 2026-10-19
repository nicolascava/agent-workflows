import { expect, test } from "bun:test";
import { captureGitHubEpicBoardContext, validateGitHubEpicBoardContext } from "./github-epic-board-context.ts";
const identity = { parentIssueId: "p", projectId: "B" };
test("captures one fresh context and binds it to the operation identity", async () => {
  const calls: string[] = [];
  const context = await captureGitHubEpicBoardContext(identity, {
    children: async () => { calls.push("children"); return []; },
    fields: async () => { calls.push("fields"); return { project: { id: "B", number: 1, title: "Work" }, fields: [] }; },
    snapshot: async () => { calls.push("snapshot"); return { projectId: "B", items: [] }; },
  }, () => 0);
  expect(calls).toEqual(["children", "fields", "snapshot"]); expect(validateGitHubEpicBoardContext(context, identity)).toEqual(context);
  expect(() => validateGitHubEpicBoardContext(context, { ...identity, parentIssueId: "other" })).toThrow();
  expect(() => validateGitHubEpicBoardContext({ ...context, fields: { ...context.fields, cached: true } }, identity)).toThrow();
});
