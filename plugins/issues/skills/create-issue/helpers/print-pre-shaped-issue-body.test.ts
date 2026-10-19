import { expect, test } from "bun:test";
import { buildPreShapedIssueBody } from "./print-pre-shaped-issue-body.ts";
test("keeps intake facts, explicit links and unknown context without inventing scope", () => {
  const body = buildPreShapedIssueBody({ problem: "Save fails.", sources: ["https://example.com/report"], suggestedSolution: "## Constraints\nTry a queue." });
  expect(body).toContain("## Problem\n\nSave fails."); expect(body).toContain("## Context\n\nUnknown.");
  expect(body).toContain("### Constraints"); expect(body).toContain("https://example.com/report");
  expect(() => buildPreShapedIssueBody({ problem: "" })).toThrow();
});
