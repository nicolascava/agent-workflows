import { expect, test } from "bun:test";
import { cpSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { fixture, invoke, output, pluginRoot, put } from "./test-support";

test("unresolvable, relative, empty, file, and mismatched plugin roots suppress hook effects", () => {
  const project = fixture();
  put(project, "package.json", { dependencies: { next: "*" } });
  const file = put(project, "file", "text");
  for (const root of [join(project, "missing"), ".", "", file, project]) {
    const result = invoke("nextjs-context", { cwd: project }, { CLAUDE_PLUGIN_ROOT: root });
    expect(result.exitCode).toBe(0);
    expect(output(result)).toBe("");
  }
});

test("plugin roots use physical paths and work from installations with spaces", () => {
  const parent = fixture();
  const copy = join(parent, "plugin with spaces");
  cpSync(pluginRoot, copy, { recursive: true });
  const alias = join(parent, "alias");
  symlinkSync(copy, alias);
  const project = fixture();
  put(project, "package.json", { devDependencies: { next: "*" } });
  const result = invoke("nextjs-context", { cwd: project }, { CLAUDE_PLUGIN_ROOT: alias, REPO_ROOT: project, PROJECT_ROOT: project }, copy);
  expect(result.exitCode).toBe(0);
  expect(output(result)).toContain(join(copy, "docs/nextjs.md"));
});
