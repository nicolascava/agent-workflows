#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { parseTestPlan, visibleLines } from "./execute-test-plan.ts";

export function checkCopy(title: string, body: string, allowClosing = false, originalBody?: string) {
  const violations: { rule: string; message: string }[] = [];
  const add = (rule: string, message: string) => violations.push({ rule, message });
  if (!title.trim() || title.length > 72 || /[\r\n]/.test(title)) add("title-length", "Use one nonempty title of at most 72 characters");
  if (/^(?:feat|fix|chore|docs|refactor|test|style|perf|ci|build|revert)(?:\([^)]*\))?:/i.test(title)) add("title-prefix", "Use a plain imperative title");
  if (/#\d+/.test(title)) add("title-issue-id", "Put issue links in the body");
  if (/\.\s*$/.test(title)) add("title-trailing-period", "Remove the trailing period");
  for (const [surface, text] of [["title", title], ["body", body]]) {
    const prose = text!.replace(/(`{3,}|~{3,})[^\n]*\n[\s\S]*?\1/g, "").replace(/`[^`\n]*`/g, "");
    if (/\u2014|\s--\s/.test(prose)) add(`${surface}-dash`, "Use a comma or period in prose");
    if (/\\`/.test(text!)) add(`${surface}-escaped-backtick`, "Use literal backticks in the file");
    if (/co-authored-by:|generated (?:with|by) (?:an? )?(?:AI|assistant)/i.test(text!)) add(`${surface}-attribution`, "Remove assistant attribution");
  }
  try {
    const lines = visibleLines(body);
    const headings = lines.map((l, i) => ({ name: /^##\s+(.+?)\s*$/.exec(l)?.[1]?.toLowerCase(), line: i })).filter(h => h.name);
    const names = headings.map(h => h.name);
    if (!names.includes("summary")) add("body-missing-summary", "Add a visible Summary section");
    if (!names.includes("test plan")) add("body-missing-test-plan", "Add a visible Test plan section");
    if (!["summary,test plan", "summary,test plan,plan output,rollback"].includes(names.join(","))) add("body-section-order", "Use Summary, Test plan, then optional Plan output and Rollback");
    const summary = headings.find(h => h.name === "summary"), plan = headings.find(h => h.name === "test plan");
    const bullets = summary && plan ? lines.slice(summary.line + 1, plan.line).filter(l => /^[-*+] \S/.test(l)).length : 0;
    if (bullets < 1 || bullets > 3) add("body-summary-bullets", "Use one to three summary bullets");
    if (!parseTestPlan(body).length) add("body-test-plan-items", "Add at least one visible top-level test checkbox");
    const comments = body.match(/<!--[\s\S]*?-->/g) ?? [];
    const original = originalBody?.match(/<!--[\s\S]*?-->/g) ?? [];
    // Only unchanged legacy review contracts may survive metadata updates.
    if (comments.some(c => !/^<!--\s*review-scope\/v1\b/.test(c)) || JSON.stringify(comments) !== JSON.stringify(original)) add("body-hidden-content", "Do not add or alter hidden contracts");
    const prose = lines.join("\n");
    if (/(?:^|[^\w/#])(?:[\w.-]+\/[\w.-]+)?#\d+\b/.test(prose)) add("body-short-reference", "Use the canonical issue URL");
    if (/`[^`\n]*https:\/\/github\.com\/[^\s`]+\/(?:issues|pull)\/\d+[^`\n]*`/.test(prose)) add("body-backticked-reference", "Keep issue URLs outside code spans");
    // Markdown links are normalized only for detecting closing keywords.
    const references = prose.replace(/\[([^\]]*)\]\((<?https:\/\/github\.com\/[^)]+>?)\)/g, "$2").replace(/[<>]/g, "");
    if (!allowClosing && /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+https:\/\/github\.com\/[^\s/]+\/[^\s/]+\/(?:issues|pull)\/\d+\b/i.test(references)) add("body-closing-reference", "Use Related unless the user asked to close the issue");
  } catch { add("body-markup", "Repair malformed or ambiguous Markdown"); }
  return { ok: violations.length === 0, violations };
}
if (import.meta.main) {
  try {
    const args = process.argv.slice(2), options = new Map<string, string>();
    let allowClosing = false;
    for (let i = 0; i < args.length; i++) {
      const key = args[i]!;
      if (key === "--allow-closing-issues" && !allowClosing) { allowClosing = true; continue; }
      if (!["--title-file", "--body-file", "--original-body-file"].includes(key) || options.has(key) || !args[i + 1] || args[i + 1]!.startsWith("--")) throw new Error("invalid arguments");
      options.set(key, args[++i]!);
    }
    if (!options.has("--title-file") || !options.has("--body-file")) throw new Error("usage: check-pr-copy.ts --title-file <file> --body-file <file> [--original-body-file <file>] [--allow-closing-issues]");
    const result = checkCopy(readFileSync(options.get("--title-file")!, "utf8").trimEnd(), readFileSync(options.get("--body-file")!, "utf8"), allowClosing, options.has("--original-body-file") ? readFileSync(options.get("--original-body-file")!, "utf8") : undefined);
    console.log(JSON.stringify(result)); process.exitCode = result.ok ? 0 : 1;
  } catch (error) { console.error(`check-pr-copy: ${error instanceof Error ? error.message : "invalid input"}`); process.exitCode = 2; }
}
