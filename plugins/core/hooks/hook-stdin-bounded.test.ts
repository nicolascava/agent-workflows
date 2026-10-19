import { expect, test } from "bun:test";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { fixture, invoke, output, pluginRoot, put } from "./test-support";

test("partial, oversized, and malformed stdin produce no advisory effects", () => {
  for (const name of ["nextjs-context", "documentation-guidance", "format-after-edit"]) {
    for (const payload of ['{"cwd":', "x".repeat(1024 * 1024 + 1), "[]"]) {
      const result = invoke(name, payload, { CORE_FORMAT_AFTER_EDIT: "1" });
      expect(result.exitCode).toBe(0); expect(output(result)).toBe("");
    }
  }
});
test("a complete payload on an open pipe cannot execute and has a total read deadline", async () => {
  const root = fixture(); put(root, "package.json", { dependencies: { next: "*" } });
  for (const command of [["bash", join(pluginRoot, "hooks/nextjs-context.sh")], [process.execPath, join(pluginRoot, "hooks/nextjs-context.ts")]]) {
    const started = performance.now();
    const child = Bun.spawn(command, { stdin: "pipe", stdout: "pipe", stderr: "pipe", env: { ...process.env, CLAUDE_PLUGIN_ROOT: pluginRoot } });
    try {
      child.stdin.write(JSON.stringify({ cwd: root })); child.stdin.flush();
      await Promise.race([child.exited, Bun.sleep(4500).then(() => { throw new Error("stdin deadline exceeded"); })]);
      expect(await new Response(child.stdout).text()).toBe("");
      expect(await child.exited).toBe(0);
      expect(performance.now() - started).toBeLessThan(4000);
    } finally { child.stdin.end(); child.kill(); await child.exited; }
  }
}, 12000);

test("a stalled guard denies instead of applying the read-tool prefilter", async () => {
  const root = join(fixture(), "plugin");
  cpSync(pluginRoot, root, { recursive: true });
  put(root, "hooks/policy.ts", "");
  const script = put(root, "hooks/check.sh", '#!/bin/bash\nsource "$(dirname "$0")/guard-shim.sh"\nrun_guard hooks/policy.ts\n');
  const child = Bun.spawn(["bash", script], { stdin: "pipe", stdout: "pipe", stderr: "pipe", env: { ...process.env, CLAUDE_PLUGIN_ROOT: root } });
  try {
    child.stdin.write(JSON.stringify({ tool_name: "Read", tool_input: {} })); child.stdin.flush();
    await Promise.race([child.exited, Bun.sleep(4500).then(() => { throw new Error("Guard stdin deadline exceeded"); })]);
    const result = JSON.parse(await new Response(child.stdout).text());
    expect(result.hookSpecificOutput.permissionDecision).toBe("deny");
    expect(await child.exited).toBe(0);
  } finally { child.stdin.end(); child.kill(); await child.exited; }
}, 6000);
