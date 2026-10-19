import { realpathSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { isRecord } from "./is-record";

// One total deadline, including partial lines and streams that never reach EOF.
const INPUT_DEADLINE_MS = 2000;
const INPUT_LIMIT_BYTES = 1024 * 1024;

export async function readHookInput(): Promise<Record<string, unknown>> {
  const reader = Bun.stdin.stream().getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Hook input deadline exceeded")), INPUT_DEADLINE_MS);
  });
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > INPUT_LIMIT_BYTES) throw new Error("Hook input too large");
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const payload: unknown = JSON.parse(text);
    if (!isRecord(payload)) throw new Error("Invalid hook input");
    return payload;
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}

export function containsPath(root: string, path: string): boolean {
  const child = relative(root, path);
  return child === "" || (!isAbsolute(child) && child !== ".." && !child.startsWith(`..${sep}`));
}

export function hookRoot(): string {
  const root = realpathSync(join(import.meta.dir, ".."));
  const supplied = process.env.CLAUDE_PLUGIN_ROOT;
  if (supplied !== undefined) {
    if (!isAbsolute(supplied) || realpathSync(supplied) !== root || !statSync(supplied).isDirectory()) {
      throw new Error("Invalid plugin root");
    }
  }
  return root;
}

export function localFile(root: string, path: string, executable = false): string {
  if (isAbsolute(path) || path.split(/[\\/]/).some((part) => part === ".." || part === ".")) throw new Error("Invalid plugin path");
  const physical = realpathSync(join(root, path));
  const info = statSync(physical);
  if (!containsPath(root, physical) || !info.isFile() || (executable && !(info.mode & 0o111))) throw new Error("Invalid plugin file");
  return physical;
}

export function projectDirectory(payload: Record<string, unknown>): string {
  // A supplied but malformed cwd must never fall back to a different repository.
  const cwd = payload.cwd === undefined ? process.env.CLAUDE_PROJECT_DIR : payload.cwd;
  if (typeof cwd !== "string" || !isAbsolute(cwd)) throw new Error("Invalid project directory");
  const physical = realpathSync(cwd);
  if (!statSync(physical).isDirectory()) throw new Error("Invalid project directory");
  return physical;
}

export function packageRoot(cwd: string): string | null {
  for (let current = cwd; ; current = dirname(current)) {
    try { statSync(join(current, "package.json")); return current; } catch {}
    try { statSync(join(current, ".git")); return null; } catch {}
    if (dirname(current) === current) return null;
  }
}

export function readManifest(root: string): Record<string, unknown> {
  const value: unknown = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  if (!isRecord(value)) throw new Error("Invalid package manifest");
  return value;
}

export function sessionContext(text: string): void {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: text } }));
}

export function deny(reason = "Could not verify this call safely."): void {
  console.log(JSON.stringify({ hookSpecificOutput: {
    hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason.replace(/[\x00-\x1f]/g, ""),
  } }));
}
