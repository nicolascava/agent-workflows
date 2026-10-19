import { headingText, issueBodySections } from "./issue-body-sections.ts";
export function upsertIssueRationale(body: string, rationale: string) {
  if (body.startsWith("\uFEFF")) return "\uFEFF" + upsertIssueRationale(body.slice(1), rationale);
  const text = rationale.trim();
  const prose = (value: string) => value.trim() && !/^(?:\s*(?:#{1,6}\s|[-+*]\s|\d+[.)]\s|>|`{3}|~{3}|\||\[[^\]]+\]:| {4}|\t)|\s*[=-]{3,}\s*$)/m.test(value) && !/<\/?[A-Za-z][^>]*>/.test(value);
  if (!prose(text)) throw new Error("Rationale must contain plain paragraphs");
  if (/^\s*(?:>\s*|[-+*]\s+).*#{1,6}\s+[*_`~]*priority rationale/im.test(body)) throw new Error("Nested rationale heading");
  const sections = issueBodySections(body), matches = sections.filter(section => headingText(section.title).toLowerCase() === "priority rationale");
  if (matches.length > 1 || matches.some(section => section.title !== "Priority rationale" || section.level !== 2 || section.style !== "atx")) throw new Error("Ambiguous rationale heading");
  const old = matches[0], eol = body.includes("\r\n") ? "\r\n" : "\n";
  if (old && sections.some(section => section.start > old.start && section.start < old.end)) throw new Error("Nested rationale heading");
  if (old && !prose(body.slice(old.contentStart, old.end))) throw new Error("Existing rationale is not plain prose");
  const replacement = `## Priority rationale${eol}${eol}${text.replace(/\r?\n/g, eol)}${eol}${eol}`;
  if (old) {
    const ending = body.slice(old.contentStart, old.end).match(/(?:\r?\n)*$/)?.[0] ?? "";
    return body.slice(0, old.start) + replacement.slice(0, -2 * eol.length) + ending + body.slice(old.end);
  }
  const anchor = sections.find(section => section.level === 2 && ["Sources", "Shaped by"].includes(section.title))?.start ?? body.length;
  const before = body.slice(0, anchor), separator = before && !before.endsWith(eol + eol) ? before.endsWith(eol) ? eol : eol + eol : "";
  return before + separator + replacement + body.slice(anchor);
}
