import { expect, test } from "bun:test";
import { upsertIssueRationale } from "./upsert-issue-rationale.ts";
test("changes only the rationale span and inserts before Sources", () => {
  const body = "\uFEFF## Problem\r\n\r\nKeep exact.\r\n\r\n## Sources\r\n\r\nhttps://example.com\r\n\r\n";
  const next = upsertIssueRationale(body, "Impact is high because save fails.");
  expect(next.startsWith("\uFEFF## Problem\r\n\r\nKeep exact.\r\n\r\n")).toBe(true);
  expect(next.endsWith("## Sources\r\n\r\nhttps://example.com\r\n\r\n")).toBe(true);
  expect(upsertIssueRationale(next, "Impact is high because save fails.")).toBe(next);
});
test("keeps the byte order mark first when inserting before the first heading", () => {
  expect(upsertIssueRationale("\uFEFF## Sources\n\nKeep.", "A reason.")).toBe("\uFEFF## Priority rationale\n\nA reason.\n\n## Sources\n\nKeep.");
});
test("refuses near headings, duplicates, lists, nested headings and empty rationale", () => {
  for (const body of ["### Priority rationale\n\nOld", "## **Priority rationale**\n\nOld", "## Priority rationale\n\nA\n\n## Priority rationale\n\nB", "## Priority rationale\n\n### Nested\nText"]) expect(() => upsertIssueRationale(body, "New.")).toThrow();
  for (const text of ["", "- item", "```code\ntext\n```", "## heading", "<b>html</b>"]) expect(() => upsertIssueRationale("## Sources\n\nUnknown.", text)).toThrow();
});
test("refuses destructive replacement of non-prose and retains EOF newlines", () => {
  for (const content of ["- a list", "| table |", "<b>inline</b>", "[note]: link", "```\ncode\n```", ""]) expect(() => upsertIssueRationale(`## Priority rationale\n\n${content}\n\n## Sources\n\nKeep.`, "New.")).toThrow();
  expect(upsertIssueRationale("## Priority rationale\n\nOld.", "New.")).toBe("## Priority rationale\n\nNew.");
  expect(upsertIssueRationale("## Priority rationale\n\nOld.\n", "New.")).toBe("## Priority rationale\n\nNew.\n");
  for (const body of ["> ## Priority rationale\n> Old.", "- ## Priority rationale\n  Old."]) expect(() => upsertIssueRationale(body, "New.")).toThrow();
});
