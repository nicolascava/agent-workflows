export type Section = { title: string; level: number; start: number; contentStart: number; end: number; style: "atx" | "setext" };
export function headingText(title: string) { return title.replace(/[*_`~]/g, "").replace(/\s+#+\s*$/, "").trim(); }
// A conservative section reader, not a general Markdown renderer. Refuse blocks
// whose rendering could hide a section from the review gate.
export function issueBodySections(body: string): Section[] {
  const rows: { text: string; start: number; end: number }[] = []; let offset = 0;
  for (const match of body.matchAll(/[^\n]*(?:\n|$)/g)) {
    if (!match[0]) continue;
    rows.push({ text: match[0].replace(/\r?\n$/, ""), start: offset, end: offset + match[0].length }); offset += match[0].length;
  }
  const result: Section[] = []; let fence: { char: string; length: number } | null = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i], text = row.text.replace(/^\uFEFF/, ""), marker = text.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) { if (new RegExp(`^ {0,3}${fence.char}{${fence.length},}\\s*$`).test(text)) fence = null; continue; }
    if (marker) { fence = { char: marker[1][0], length: marker[1].length }; continue; }
    if (/^\s*<\/?[A-Za-z][\w-]*(?:\s|>)/.test(text) || /^\s*<!--/.test(text)) throw new Error("HTML blocks need manual section review");
    const atx = text.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/);
    const underline = rows[i + 1]?.text.match(/^ {0,3}(=+|-+)\s*$/);
    if (atx) result.push({ title: atx[2].replace(/\s+#+\s*$/, ""), level: atx[1].length, start: row.start, contentStart: row.end, end: body.length, style: "atx" });
    else if (text.trim() && !/^\s*(?:>|[-+*]\s|\d+[.)]\s|\t| {4})/.test(text) && underline) {
      result.push({ title: text.trim(), level: underline[1][0] === "=" ? 1 : 2, start: row.start, contentStart: rows[++i].end, end: body.length, style: "setext" });
    }
  }
  if (fence) throw new Error("Unclosed code fence");
  for (let i = 0; i < result.length; i++) result[i].end = result.slice(i + 1).find(section => section.level <= result[i].level)?.start ?? body.length;
  return result;
}
