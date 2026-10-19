#!/usr/bin/env bun
import { readFileSync } from "node:fs";

export interface TestPlanItem { index: number; line: number; bullet: string; text: string; checked: boolean }

// Keep physical line numbers while excluding examples and HTML comments.
// Malformed markup is ambiguous, so callers must repair the draft first.
export function visibleLines(body: string): string[] {
  const lines = body.split(/\r\n|\n|\r/);
  let comment = false;
  let fence: { marker: string; length: number } | undefined;
  const result = lines.map(raw => {
    if (fence) {
      const end = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(raw);
      if (end && end[1]![0] === fence.marker && end[1]!.length >= fence.length) fence = undefined;
      return "";
    }
    // Parse comments only outside fences.
    let visible = "", rest = raw;
    while (rest) {
      if (comment) {
        const end = rest.indexOf("-->");
        if (end < 0) { rest = ""; break; }
        comment = false; rest = rest.slice(end + 3);
      } else {
        const start = rest.indexOf("<!--");
        if (start < 0) { visible += rest; break; }
        visible += rest.slice(0, start); rest = rest.slice(start + 4); comment = true;
      }
    }
    const start = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(visible);
    if (start) { fence = { marker: start[1]![0]!, length: start[1]!.length }; return ""; }
    const prose = visible.replace(/(?<!`)(`+)(?!`)(.*?)(?<!`)\1(?!`)/g, "");
    if (/<\/?[a-z][a-z0-9-]*(?=\s|\/?>|$)/i.test(prose)) throw new Error("raw HTML is ambiguous; use visible Markdown or fenced examples");
    return visible;
  });
  if (comment || fence) throw new Error("unterminated comment or fence");
  return result;
}

export function parseTestPlan(body: string): TestPlanItem[] {
  const items: TestPlanItem[] = [];
  let inPlan = false, headings = 0;
  visibleLines(body).forEach((line, index) => {
    if (/^ {0,3}#{1,6}\s/.test(line)) {
      inPlan = /^##\s+test\s+plan\s*$/i.test(line);
      if (inPlan && ++headings > 1) throw new Error("duplicate Test plan sections");
    } else if (inPlan) {
      const m = /^([-*+]) \[([ xX])\] (\S.*?)\s*$/.exec(line);
      if (m) items.push({ index: items.length, line: index + 1, bullet: m[1]!, text: m[3]!, checked: m[2] !== " " });
    }
  });
  return items;
}
export function toggleAt(body: string, index: number): { body: string; changed: boolean } {
  const item = parseTestPlan(body)[index];
  if (!Number.isInteger(index) || index < 0 || !item) throw new Error("checkbox index is out of range");
  if (item.checked) return { body, changed: false };
  // Use the raw lines so line endings and all bytes except the marker survive.
  const lines = body.split(/(?<=\n)|(?<=\r)(?!\n)/);
  // A comment before the bullet could shift visible columns. Refuse that case.
  const line = lines[item.line - 1]!;
  if (!/^[-*+] \[ \] /.test(line)) throw new Error("checkbox must start on its own physical line");
  lines[item.line - 1] = line.slice(0, 3) + "x" + line.slice(4);
  return { body: lines.join(""), changed: true };
}
if (import.meta.main) {
  try {
    const [action, path, index, ...extra] = process.argv.slice(2);
    if (!path || extra.length || !["show", "check"].includes(action!) || (action === "show" && index !== undefined) || (action === "check" && !/^(?:0|[1-9][0-9]*)$/.test(index ?? ""))) throw new Error("usage: execute-test-plan.ts show <body-file> | check <body-file> <index>");
    const body = readFileSync(path, "utf8");
    if (action === "show") console.log(JSON.stringify({ items: parseTestPlan(body) }));
    else process.stdout.write(toggleAt(body, Number(index)).body);
  } catch (error) { console.error(`execute-test-plan: ${error instanceof Error ? error.message : "invalid input"}`); process.exitCode = 1; }
}
