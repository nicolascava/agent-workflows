import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

const repo = resolve(import.meta.dir, "..");
// Canonical authoring copy; installed plugins retain independent local copies.
const canonical = resolve(repo, "plugins/core/docs/verification-source.md");

function contracts(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? contracts(path) : basename(path) === "verification-source.md" ? [path] : [];
  });
}

const copies = contracts(resolve(repo, "plugins"));
test("verification-source contract copies include the canonical document", () => {
  expect(copies).toContain(canonical);
  expect(copies.length).toBeGreaterThanOrEqual(3);
});

for (const copy of copies.filter(path => path !== canonical)) {
  test(`${relative(repo, copy)} is byte-identical to the canonical contract`, () => {
    expect(readFileSync(copy).equals(readFileSync(canonical))).toBe(true);
  });
}
