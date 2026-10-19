export function normalizeIssueBody(body: string): string {
  const eol = body.includes("\r\n") ? "\r\n" : "\n", lines = body.split(/\r?\n/), output: string[] = [];
  let fence: { char: string; length: number } | null = null;
  const structural = (line: string) => !line.trim() || /^(?: {4}|\t|\s*#{1,6}\s|\s*>|\s*\||\s*<|\s*(?:[-+*]|\d+[.)])\s|\s*(?:git|gh|curl|\$)\s|\s*[-=*]{3,}\s*$)/.test(line);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index], marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      output.push(line);
      if (new RegExp(`^ {0,3}${fence.char}{${fence.length},}\\s*$`).test(line)) fence = null;
      continue;
    }
    if (marker) { fence = { char: marker[1][0], length: marker[1].length }; output.push(line); continue; }
    const next = lines[index + 1];
    const listContinuation = /^ {1,3}\S/.test(line) && /^\s*(?:[-+*]|\d+[.)])\s/.test(output.at(-1) ?? "");
    const previous = output.at(-1);
    if (previous !== undefined && !/ {2}$|\\$/.test(previous) && !/ {2}$|\\$/.test(line) && ((!structural(line) && !structural(previous)) || listContinuation) && !/^ {0,3}(?:`{3,}|~{3,})/.test(line) && !/^\s*(?:=+|-+)\s*$/.test(next ?? "") && !/^\s*(?:=+|-+)\s*$/.test(line)) output[output.length - 1] += " " + line.trim();
    else output.push(line);
  }
  return output.join(eol);
}
