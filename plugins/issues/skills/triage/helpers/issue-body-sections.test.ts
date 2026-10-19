import { expect, test } from "bun:test";
import { issueBodySections } from "./issue-body-sections.ts";
test("tracks exact spans, BOM, CRLF, fences, and Setext headings", () => {
  const body = "\uFEFF## Problem\r\n\r\nText\r\n\r\n```md\r\n## Fake\r\n```\r\n\r\nSources\r\n-------\r\n\r\nLink\r\n";
  const sections = issueBodySections(body); expect(sections.map(s => s.title)).toEqual(["Problem", "Sources"]);
  expect(body.slice(sections[0].start, sections[0].end)).toContain("## Fake"); expect(sections[1].style).toBe("setext");
});
test("refuses unclosed fences and ambiguous HTML wrappers", () => {
  for (const body of ["```\n## Problem", "<details>\n## Sources\n</details>"]) expect(() => issueBodySections(body)).toThrow();
});
