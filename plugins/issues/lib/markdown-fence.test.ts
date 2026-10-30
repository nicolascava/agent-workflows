import { expect, test } from "bun:test";
import { parseFenceOpener, closesFence } from "./markdown-fence.ts";
import { waitingSignals } from "./github-waiting-replies.ts";
import { issueBodySections } from "../skills/triage/helpers/issue-body-sections.ts";

test("recognizes fence openers and preserves the rest of the line", () => {
  for (const [line, character, length, rest] of [
    ["```", "`", 3, ""],
    ["~~~~text", "~", 4, "text"],
    [" ``` js ", "`", 3, " js "],
    ["  ~~~info", "~", 3, "info"],
    ["   `````lang", "`", 5, "lang"],
    ["```~~~", "`", 3, "~~~"],
    ["~~~a\u2028b\u2029c\rd", "~", 3, "a\u2028b\u2029c\rd"],
  ] as const) {
    expect(parseFenceOpener(line)).toEqual({ character, length, rest });
  }
  for (const line of ["", "``", "~~", "`~~", "    ```", "\t~~~", " \t```", "\uFEFF```", "text ~~~"]) {
    expect(parseFenceOpener(line)).toBeNull();
  }
});

test("closes only matching fences with enough markers and a whitespace-only suffix", () => {
  for (const [line, character, length, closes] of [
    ["```", "`", 3, true],
    ["~~~~~", "~", 4, true],
    ["   ~~~~ \t", "~", 4, true],
    ["  ```\u2028\u2029\r\uFEFF", "`", 3, true],
    ["~~~", "`", 3, false],
    ["```", "~", 3, false],
    ["~~~", "~", 4, false],
    ["``", "`", 3, false],
    ["    ```", "`", 3, false],
    ["\t~~~", "~", 3, false],
    ["```text", "`", 3, false],
    ["~~~ text", "~", 3, false],
    ["```~~~", "`", 3, false],
    ["\uFEFF```", "`", 3, false],
  ] as const) {
    expect(closesFence(line, { character, length })).toBe(closes);
  }
});

function signals(body: string) {
  return waitingSignals({ author: "other", threads: [], comments: [{
    id: "1", author: "other", body, createdAt: "2026-01-01T00:00:00Z",
    url: "https://example.com/comment", human: true,
  }] }, "reviewer");
}

for (const separator of ["\u2028", "\u2029", "\r"]) {
  test(`callers retain their opener policy for ${JSON.stringify(separator)}`, () => {
    const body = `~~~info${separator}more\n## Hidden\nfirst\nsecond\n~~~\n## Visible`;
    expect(issueBodySections(body).map(section => section.title)).toEqual(["Visible"]);
    expect(signals(`~~~info${separator}more\n@reviewer urgent`)).toMatchObject([{ reason: "mention", urgent: true }]);
    expect(signals("~~~info\n@reviewer urgent")).toEqual([]);
  });

  test(`waiting replies retain their closer policy for ${JSON.stringify(separator)}`, () => {
    expect(signals(`~~~\n~~~ ${separator} \n@reviewer urgent`)).toEqual([]);
    expect(signals("~~~\n~~~ \t\n@reviewer urgent")).toMatchObject([{ reason: "mention", urgent: true }]);
  });
}

test("callers retain BOM and unclosed-fence handling", () => {
  expect(issueBodySections("\uFEFF~~~\n## Hidden\n\uFEFF~~~\n## Visible").map(section => section.title)).toEqual(["Visible"]);
  expect(signals("\uFEFF~~~\n@reviewer")).toMatchObject([{ reason: "mention" }]);
  expect(() => issueBodySections("~~~\n## Hidden")).toThrow("Unclosed code fence");
  expect(signals("~~~\n@reviewer")).toEqual([]);
});
