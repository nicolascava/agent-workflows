import { expect, test } from "bun:test";
import { normalizeIssueBody } from "./normalize-issue-body.ts";
test("unwraps paragraphs and lazy list continuation while preserving structure", () => {
  expect(normalizeIssueBody("## Problem\n\nFirst line\nsecond line\n\n- item\n  continuation\n\n> quote\n| cell |\n")).toBe("## Problem\n\nFirst line second line\n\n- item continuation\n\n> quote\n| cell |\n");
});
test("preserves fences of matching lengths, code, commands and hard breaks", () => {
  const input = "````text\n```\nwrapped\ntext\n````\n\n    indented code\n    more code\n\ngh issue view 1\nnext\n\nHard  \nbreak\n";
  expect(normalizeIssueBody(input)).toBe(input);
});
test("normalization is idempotent and retains line ending style", () => {
  for (const input of ["One\ntwo", "One\r\ntwo\r\n", "## Heading\n\nA\nB\n"]) expect(normalizeIssueBody(normalizeIssueBody(input))).toBe(normalizeIssueBody(input));
  expect(normalizeIssueBody("One\r\ntwo\r\n")).toBe("One two\r\n");
});
