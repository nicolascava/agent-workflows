import { expect, test } from "bun:test";
import { normalizeRepository, parseProject, resolveGitHubTarget } from "./github-target.ts";

test("resolves a bare issue against gh repo view", async () => {
  expect(await resolveGitHubTarget({ issue: "12" }, async () => '{"nameWithOwner":"sample/widgets"}')).toEqual({ repository: "sample/widgets", issue: "https://github.com/sample/widgets/issues/12" });
});
test("binds explicit issue URLs and rejects cross-repository disagreement", async () => {
  const gh = async () => { throw Error("must not call"); };
  expect((await resolveGitHubTarget({ issue: "https://github.com/sample/widgets/issues/3" }, gh)).repository).toBe("sample/widgets");
  await expect(resolveGitHubTarget({ repository: "sample/other", issue: "https://github.com/sample/widgets/issues/3" }, gh)).rejects.toThrow();
});
test("parses issue panes and binds their project", async () => {
  const result = await resolveGitHubTarget({ issue: "https://github.com/orgs/sample/projects/8?pane=issue&issue=sample%7Cwidgets%7C3" }, async () => { throw Error(); });
  expect(result.project).toEqual({ owner: "sample", number: 8 });
  await expect(resolveGitHubTarget({ issue: "https://github.com/orgs/sample/projects/8?pane=issue&issue=sample%7Cwidgets%7C3", project: "sample/9" }, async () => "")).rejects.toThrow();
});
test("rejects unsafe repository and project references", () => {
  for (const value of ["../widgets", "sample/..", "sample/widgets/extra", "--help/x"]) expect(() => normalizeRepository(value)).toThrow();
  for (const value of ["sample/0", "sample/1.2", "sample/9007199254740992"]) expect(() => parseProject(value)).toThrow();
});
test("rejects invalid issue input before gh", async () => {
  await expect(resolveGitHubTarget({ repository: "sample/widgets", issue: "oops" }, async () => { throw Error("network"); })).rejects.toThrow("Issue");
});
