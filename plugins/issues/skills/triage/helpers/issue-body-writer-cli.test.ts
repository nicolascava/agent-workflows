import { expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync, symlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import { writeRationaleFile } from "./issue-body-writer-cli.ts";
test("writes exact bytes, refuses input aliases and removes stale output on failure", () => {
  const root = join(import.meta.dir, `.test-writer-${crypto.randomUUID()}`); mkdirSync(root);
  const body = join(root, "body"), text = join(root, "text"), out = join(root, "out");
  try {
    writeFileSync(body, "\uFEFF## Sources\r\n\r\nKeep.\r\n"); writeFileSync(text, "Reason.");
    writeRationaleFile(body, text, out); expect(readFileSync(out, "utf8")).toContain("\r\n");
    expect(() => writeRationaleFile(body, text, body)).toThrow(); symlinkSync(body, join(root, "alias"));
    expect(() => writeRationaleFile(body, text, join(root, "alias"))).toThrow();
    writeFileSync(text, "- invalid"); expect(() => writeRationaleFile(body, text, out)).toThrow(); expect(existsSync(out)).toBe(false);
    expect(readFileSync(body, "utf8")).toContain("Keep.");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
