import { expect, test } from "bun:test";
import { symlinkSync } from "node:fs";
import { join } from "node:path";
import { fixture, invoke, output, pluginRoot, put } from "./test-support";

test("runtime and development Next.js dependencies point to bundled guidance", () => {
  for (const field of ["dependencies", "devDependencies"]) {
    const root = fixture();
    put(root, "package.json", { [field]: { next: "*" } });
    const result = invoke("nextjs-context", { cwd: root });
    expect(result.exitCode).toBe(0);
    const context = JSON.parse(output(result)).hookSpecificOutput;
    expect(context.hookEventName).toBe("SessionStart");
    expect(context.additionalContext).toContain(join(pluginRoot, "docs/nextjs.md"));
  }
});
test("cwd wins over the project dir, with project dir as fallback", () => {
  const next = fixture(); const other = fixture();
  put(next, "package.json", { dependencies: { next: "*" } });
  put(other, "package.json", {});
  expect(output(invoke("nextjs-context", {}, { CLAUDE_PROJECT_DIR: next }))).toContain("nextjs.md");
  expect(output(invoke("nextjs-context", { cwd: other }, { CLAUDE_PROJECT_DIR: next }))).toBe("");
  expect(output(invoke("nextjs-context", { cwd: 3 }, { CLAUDE_PROJECT_DIR: next }))).toBe("");
});
test("declared package workspaces and nested working directories are detected", () => {
  const root = fixture();
  put(root, "package.json", { workspaces: { packages: ["modules/*", "!modules/ignored"] } });
  put(root, "modules/site/package.json", { dependencies: { next: "*" } });
  put(root, "modules/site/src/page.ts", "");
  expect(output(invoke("nextjs-context", { cwd: root }))).toContain("nextjs.md");
  expect(output(invoke("nextjs-context", { cwd: join(root, "modules/site/src") }))).toContain("nextjs.md");
});
test("no dependency, missing or malformed manifests, ignored workspaces, and external symlinks are silent", () => {
  for (const manifest of [{}, { peerDependencies: { next: "*" } }, { optionalDependencies: { next: "*" } }, "{", { workspaces: ["../*"] }]) {
    const root = fixture(); put(root, "package.json", manifest);
    const result = invoke("nextjs-context", { cwd: root });
    expect(result.exitCode).toBe(0); expect(output(result)).toBe("");
  }
  expect(output(invoke("nextjs-context", { cwd: fixture() }))).toBe("");
  const root = fixture(); const external = fixture();
  put(root, "package.json", { workspaces: ["modules/*", "!modules/ignored"] });
  put(root, "modules/ignored/package.json", { dependencies: { next: "*" } });
  put(external, "package.json", { dependencies: { next: "*" } });
  symlinkSync(external, join(root, "modules/external"));
  expect(output(invoke("nextjs-context", { cwd: root }))).toBe("");
});
test("malformed hook input never emits guidance", () => {
  for (const payload of ["", "{", "null", "[]", { cwd: "/missing-project" }]) {
    const result = invoke("nextjs-context", payload);
    expect(result.exitCode).toBe(0); expect(output(result)).toBe("");
  }
});

test("an empty nearest manifest blocks discovery in an unrelated ancestor", () => {
  const parent = fixture(); put(parent, "package.json", { dependencies: { next: "*" } });
  put(parent, "nested/package.json", "");
  expect(output(invoke("nextjs-context", { cwd: join(parent, "nested") }))).toBe("");
});
