import { headingText, issueBodySections } from "./issue-body-sections.ts";
export function issueStructureGate(body: string, mode: "draft" | "readback" | "refined" = "draft") {
  const errors: string[] = [], warnings: string[] = []; let sections;
  try { sections = issueBodySections(body); } catch (error) { return { status: "fail", errors: [String(error)], warnings, words: 0 }; }
  const legacy = mode === "readback" && sections.some(s => s.title === "Solution" && s.level === 2) && !sections.some(s => headingText(s.title).toLowerCase() === "constraints");
  const required = ["Problem", legacy ? "Solution" : "Constraints", "No-gos", "Sources"];
  for (const title of required) {
    const matches = sections.filter(s => headingText(s.title).toLowerCase() === title.toLowerCase());
    if (matches.length !== 1 || matches[0].title !== title || matches[0].level !== 2) { errors.push(`Require one canonical ## ${title}`); continue; }
    const content = body.slice(matches[0].contentStart, matches[0].end).trim();
    if (!content || /^(?:unknown|tbd|todo|placeholder|n\/a)[.!]?$/i.test(content) || /<!--/.test(content)) errors.push(`${title} needs concrete content`);
  }
  if (sections.some(s => /^(?:suggested solution|solution)$/i.test(headingText(s.title)) && !(legacy && s.title === "Solution" && s.level === 2))) errors.push("Remove implementation sections from a new shaped issue");
  if (sections.some(s => s.level === 1)) errors.push("Do not put a title in the issue body");
  if (/[“”‘’]/.test(body) || /\[verified\]/i.test(body)) errors.push("Use plain punctuation and evidence instead of verified tags");
  const words = sections.filter(s => s.level === 2 && !["Sources", "Context", "Steps to reproduce"].includes(s.title)).map(s => body.slice(s.contentStart, s.end).replace(/(`{3,}|~{3,})[^]*?\1/g, "")).join(" ").trim().split(/\s+/).filter(Boolean).length;
  if (mode === "draft" && (words < 250 || words > 350)) warnings.push(`Draft has ${words} words; aim for 250 to 350 when useful`);
  return { status: errors.length ? "fail" : warnings.length ? "warn" : "pass", errors, warnings, words };
}
