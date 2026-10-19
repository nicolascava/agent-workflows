import { expect, test } from "bun:test";
import { cpSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { fixture, invoke, output, pluginRoot, put } from "./test-support";

test("dispatcher accepts only shipped names and rejects paths, absent names, and extra arguments", () => {
  const root = fixture();
  put(root, "package.json", { dependencies: { next: "*" } });
  for (const name of ["../nextjs-context", "unknown", "nextjs-context.ts", ""]) {
    const result = Bun.spawnSync(["bash", join(pluginRoot, "hooks/run-hook.sh"), name], {
      stdin: Buffer.from(JSON.stringify({ cwd: root })), env: { ...process.env, CLAUDE_PLUGIN_ROOT: pluginRoot },
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toBe("");
  }
  const result = Bun.spawnSync(["bash", join(pluginRoot, "hooks/run-hook.sh"), "nextjs-context"], {
    stdin: Buffer.from(JSON.stringify({ cwd: root })), env: { ...process.env, CLAUDE_PLUGIN_ROOT: pluginRoot },
  });
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toContain(join(pluginRoot, "docs/nextjs.md"));
});

test("dispatcher never executes a project hook override", () => {
  const project = fixture();
  put(project, "package.json", { dependencies: { next: "*" } });
  put(project, ".claude/hooks/nextjs-context.sh", "#!/bin/sh\necho project-override\n", 0o755);
  expect(output(invoke("nextjs-context", { cwd: project }, { CLAUDE_PROJECT_DIR: project }))).not.toContain("project-override");
});

test("dispatcher rejects an implementation symlink outside the physical plugin root", () => {
  const copy = join(fixture(), "plugin with spaces");
  cpSync(pluginRoot, copy, { recursive: true });
  const external = fixture();
  const target = put(external, "outside.ts", 'console.log("escaped")');
  rmSync(join(copy, "hooks/nextjs-context.ts"));
  symlinkSync(target, join(copy, "hooks/nextjs-context.ts"));
  expect(output(invoke("nextjs-context", { cwd: external }, {}, copy))).toBe("");
});
