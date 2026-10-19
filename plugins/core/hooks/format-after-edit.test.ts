import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fixture, invoke, output, put } from "./test-support";

function project() {
  const root = fixture();
  const file = put(root, "src/a file.ts", "const x=1");
  const marker = join(root, "calls");
  const manager = '#!/bin/sh\nprintf "%s\\n" "$@" > "$FORMAT_MARKER"\npwd >> "$FORMAT_MARKER"\n';
  put(root, "test-bin/npm", manager, 0o755);
  return { root, file, marker, env: { CORE_FORMAT_AFTER_EDIT: "1", FORMAT_MARKER: marker, PATH: `${join(root, "test-bin")}:${process.env.PATH}` } };
}
test("formatting is off by default even when the repository has a formatter", () => {
  const p = project(); put(p.root, "package.json", { scripts: { format: "prettier --write" } }); put(p.root, "package-lock.json", {});
  const result = invoke("format-after-edit", { cwd: p.root, tool_input: { file_path: p.file } }, { ...p.env, CORE_FORMAT_AFTER_EDIT: "" });
  expect(result.exitCode).toBe(0); expect(output(result)).toBe(""); expect(existsSync(p.marker)).toBe(false);
});
test("opt-in uses the lockfile manager and format script with a literal file argument", () => {
  const p = project(); put(p.root, "package.json", { scripts: { format: "formatter", "lint:fix": "other" } }); put(p.root, "package-lock.json", {});
  const result = invoke("format-after-edit", { cwd: p.root, tool_input: { file_path: "src/a file.ts" } }, p.env);
  expect(result.exitCode).toBe(0); expect(output(result)).toBe("");
  expect(readFileSync(p.marker, "utf8").split("\n")).toEqual(["run", "format", "--", p.file, p.root, ""]);
});
test("lint:fix is supported and no formatter or missing lockfile is a no-op", () => {
  const p = project(); put(p.root, "package.json", { scripts: { "lint:fix": "formatter" } }); put(p.root, "bun.lock", "");
  put(p.root, "test-bin/bun", '#!/bin/sh\nif [ "$1" = run ]; then printf "%s\\n" "$@" > "$FORMAT_MARKER"; else exec "$REAL_BUN" "$@"; fi\n', 0o755);
  const result = invoke("format-after-edit", { cwd: p.root, tool_input: { file_path: p.file } }, { ...p.env, REAL_BUN: process.execPath });
  expect(result.exitCode).toBe(0); expect(readFileSync(p.marker, "utf8").split("\n")).toEqual(["run", "lint:fix", p.file, ""]);
  for (const manifest of [{}, { scripts: { format: "formatter" } }]) {
    const q = project(); put(q.root, "package.json", manifest);
    expect(output(invoke("format-after-edit", { cwd: q.root, tool_input: { file_path: q.file } }, q.env))).toBe("");
    expect(existsSync(q.marker)).toBe(false);
  }
});
test("a local configured formatter is discovered without a package script", () => {
  for (const [config, tool, args] of [[".prettierrc", "prettier", ["--write", "--"]], ["biome.json", "biome", ["check", "--write", "--"]], ["eslint.config.js", "eslint", ["--fix", "--"]]] as const) {
    const p = project(); put(p.root, "package.json", {}); put(p.root, config, "{}");
    put(p.root, `node_modules/.bin/${tool}`, '#!/bin/sh\nprintf "%s\\n" "$@" > "$FORMAT_MARKER"\n', 0o755);
    expect(invoke("format-after-edit", { cwd: p.root, tool_input: { file_path: p.file } }, p.env).exitCode).toBe(0);
    expect(readFileSync(p.marker, "utf8").split("\n")).toEqual([...args, p.file, ""]);
  }
});
test("files outside the project, missing files, malformed input, and generated files do not run a formatter", () => {
  const p = project(); put(p.root, "package.json", { scripts: { format: "formatter" } }); put(p.root, "package-lock.json", {});
  const outside = put(fixture(), "outside.ts", "");
  const generated = put(p.root, "node_modules/a.ts", "");
  for (const file_path of [outside, generated, "missing.ts", 3, "--help"]) {
    expect(invoke("format-after-edit", { cwd: p.root, tool_input: { file_path } }, p.env).exitCode).toBe(0);
    expect(existsSync(p.marker)).toBe(false);
  }
  expect(invoke("format-after-edit", "{", p.env).exitCode).toBe(0);
  expect(existsSync(p.marker)).toBe(false);
});

test("lockfile discovery supports other managers and rejects ambiguous lockfiles", () => {
  for (const [manager, lock] of [["yarn", "yarn.lock"], ["pnpm", "pnpm-lock.yaml"]]) {
    const p = project(); put(p.root, "package.json", { scripts: { format: "formatter" } }); put(p.root, lock!, "");
    put(p.root, `test-bin/${manager}`, '#!/bin/sh\nprintf "%s\\n" "$@" > "$FORMAT_MARKER"\n', 0o755);
    expect(invoke("format-after-edit", { cwd: p.root, tool_input: { file_path: p.file } }, p.env).exitCode).toBe(0);
    expect(readFileSync(p.marker, "utf8").split("\n")).toEqual(["run", "format", p.file, ""]);
  }
  const p = project(); put(p.root, "package.json", { scripts: { format: "formatter" } });
  put(p.root, "package-lock.json", {}); put(p.root, "yarn.lock", "");
  invoke("format-after-edit", { cwd: p.root, tool_input: { file_path: p.file } }, p.env);
  expect(existsSync(p.marker)).toBe(false);
});
