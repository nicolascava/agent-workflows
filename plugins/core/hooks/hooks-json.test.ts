import { expect, test } from "bun:test";
import { accessSync, constants, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pluginRoot } from "./test-support";

test("hook registrations use executable plugin files and cover each shipped behavior", () => {
  const config = JSON.parse(readFileSync(join(pluginRoot, "hooks/hooks.json"), "utf8"));
  expect(Object.keys(config)).toEqual(["hooks"]);
  const registrations = Object.entries(config.hooks).flatMap(([event, entries]: [string, any]) => entries.flatMap((entry: any) => entry.hooks.map((hook: any) => ({ event, matcher: entry.matcher, ...hook }))));
  expect(registrations).toHaveLength(3);
  expect(registrations.map((hook: any) => hook.event).sort()).toEqual(["PostToolUse", "SessionStart", "SessionStart"]);
  for (const hook of registrations) {
    expect(hook.type).toBe("command");
    expect(hook.command).toMatch(/^"\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/[a-z-]+\.sh"$/);
    const path = hook.command.slice(1, -1).replace("${CLAUDE_PLUGIN_ROOT}", pluginRoot);
    expect(statSync(path).isFile()).toBe(true); expect(() => accessSync(path, constants.X_OK)).not.toThrow();
    if (hook.event === "PostToolUse") expect(hook.matcher).toBe("Write|Edit|NotebookEdit");
  }
});
