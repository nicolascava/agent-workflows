import { expect, test } from "bun:test";
import { cpSync } from "node:fs";
import { join } from "node:path";
import { fixture, pluginRoot, put } from "./test-support";

function guard(payload: unknown, env: Record<string, string> = {}, classifier = "hooks/policy.ts") {
  const root = join(fixture(), "plugin");
  cpSync(pluginRoot, root, { recursive: true });
  put(root, "hooks/policy.ts", 'console.log(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"policy ran"}}))');
  put(root, "hooks/guard-test.sh", '#!/bin/bash\nsource "$(dirname "$0")/guard-shim.sh"\nrun_guard "$1"\n', 0o755);
  return Bun.spawnSync(["bash", join(root, "hooks/guard-test.sh"), classifier], {
    stdin: Buffer.from(typeof payload === "string" ? payload : JSON.stringify(payload)),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root, ...env }, timeout: 6000,
  });
}

test("generic prefilter skips only known read tools", () => {
  for (const tool_name of ["Read", "Glob", "Grep"]) {
    const result = guard({ tool_name, tool_input: {} });
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toBe("");
  }
});
test("shell commands, edits, and unknown tools reach the policy", () => {
  for (const tool_name of ["Bash", "Write", "Edit", "NotebookEdit", "mcp__example__update", "NewTool"]) {
    const result = guard({ tool_name, tool_input: { command: '"git" status' } });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout.toString()).hookSpecificOutput.permissionDecisionReason).toBe("policy ran");
  }
});
test("malformed input, invalid roots, and escaping or missing policy paths deny", () => {
  for (const payload of ["", "{", "[]", "null", {}, { tool_name: "Read", tool_input: null }, { tool_name: 3, tool_input: {} }]) {
    expect(JSON.parse(guard(payload).stdout.toString()).hookSpecificOutput.permissionDecision).toBe("deny");
  }
  for (const classifier of ["../outside.ts", "/tmp/outside.ts", "hooks/missing.ts"]) {
    expect(JSON.parse(guard({ tool_name: "Bash", tool_input: {} }, {}, classifier).stdout.toString()).hookSpecificOutput.permissionDecision).toBe("deny");
  }
  expect(JSON.parse(guard({ tool_name: "Read", tool_input: {} }, { CLAUDE_PLUGIN_ROOT: "/missing-plugin" }).stdout.toString()).hookSpecificOutput.permissionDecision).toBe("deny");
});
