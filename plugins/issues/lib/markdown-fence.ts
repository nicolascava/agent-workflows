export type MarkdownFence = { character: "`" | "~"; length: number };

export function parseFenceOpener(line: string): (MarkdownFence & { rest: string }) | null {
  const marker = line.match(/^ {0,3}(`{3,}|~{3,})/);
  if (!marker) return null;
  return { character: marker[1][0] as MarkdownFence["character"], length: marker[1].length, rest: line.slice(marker[0].length) };
}

export function closesFence(line: string, fence: MarkdownFence): boolean {
  return new RegExp(`^ {0,3}${fence.character}{${fence.length},}\\s*$`).test(line);
}
