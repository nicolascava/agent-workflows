import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parseTestPlan, toggleAt } from "./execute-test-plan.ts";

const body = "## Summary\r\n- Explain the change\r\n\r\n## Test plan\r\n- [ ] Run tests\r\n* [X] Observe output\r\n+ [ ] Verify the [ ] marker\r\n";
test("ports mixed markers, stable indices and physical line numbers", () => {
  expect(parseTestPlan(body).map(({ index, line, text, checked }) => ({ index, line, text, checked }))).toEqual([
    { index: 0, line: 5, text: "Run tests", checked: false }, { index: 1, line: 6, text: "Observe output", checked: true }, { index: 2, line: 7, text: "Verify the [ ] marker", checked: false },
  ]);
});
test("ignores nested items, comments, fenced examples and later sections", () => {
  const text = "<!--\n## Test plan\n- [ ] hidden\n-->\n## Test plan\n````md\n```\n- [ ] example\n````\n~~~text\n- [ ] example\n~~~\n  - [ ] nested\n- [ ] visible\n## Rollback\n- [ ] other";
  expect(parseTestPlan(text).map(i => i.text)).toEqual(["visible"]);
});
test("recognizes case-insensitive headings and stops at a subheading", () => {
  expect(parseTestPlan("## test PLAN\n- [ ] one\n### Detail\n- [ ] two")).toHaveLength(1);
  expect(parseTestPlan("## Summary\n- [ ] other")).toEqual([]);
});
test("refuses raw HTML that could hide the plan, while allowing code examples and URL autolinks", () => {
  for (const tag of ["<div hidden>", "<details>", "<div\nhidden>"]) expect(() => parseTestPlan(`${tag}\n## Test plan\n- [ ] hidden\n</div>`)).toThrow();
  expect(parseTestPlan("## Test plan\n- [ ] Inspect `<div hidden>` and <https://example.com>\n")).toHaveLength(1);
});
test("changes only one checkbox byte and preserves CRLF and legacy comments", () => {
  const text = `${body}\r\n<!-- review-scope/v1 preserved -->`;
  expect(toggleAt(text, 2)).toEqual({ changed: true, body: text.replace("+ [ ]", "+ [x]") });
  expect(toggleAt(text, 1)).toEqual({ changed: false, body: text });
});
test("rejects invalid indices and ambiguous or malformed Markdown", () => {
  for (const index of [-1, 3, 0.5, NaN]) expect(() => toggleAt(body, index)).toThrow();
  for (const text of ["## Test plan\n```text\n- [ ] hidden", "<!-- hidden", "## Test plan\n- [ ] one\n## Test plan\n- [ ] two"]) expect(() => parseTestPlan(text)).toThrow();
});
test("CLI reads a local file and prints a candidate without editing the input", () => {
  const root = mkdtempSync(join(tmpdir(), "test-plan-"));
  try {
    const path = join(root, "body.md"); writeFileSync(path, body);
    const script = resolve(import.meta.dir, "execute-test-plan.ts");
    const show = Bun.spawnSync([process.execPath, script, "show", path]);
    expect(show.exitCode).toBe(0); expect(JSON.parse(show.stdout.toString()).items).toHaveLength(3);
    const check = Bun.spawnSync([process.execPath, script, "check", path, "0"]);
    expect(check.exitCode).toBe(0); expect(check.stdout.toString()).toBe(body.replace("- [ ]", "- [x]"));
    expect(readFileSync(path, "utf8")).toBe(body);
    expect(Bun.spawnSync([process.execPath, script, "check", path, "0junk"]).exitCode).not.toBe(0);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
