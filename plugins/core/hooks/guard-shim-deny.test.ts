import { expect, test } from "bun:test";
import { join } from "node:path";
import { pluginRoot } from "./test-support";

function deny(reason?: string, fallback?: string) {
  return Bun.spawnSync(["bash", "-c", 'source "$1"; DENY_REASON="$2"; deny "${3-}"; echo unreachable', "guard-test", join(pluginRoot, "hooks/guard-shim.sh"), fallback ?? "", reason ?? ""]);
}
test("deny returns exactly one Claude JSON decision, escapes text, strips controls, and exits zero", () => {
  const result = deny('a "quoted" \\ reason\twith\ncontrols\r');
  expect(result.exitCode).toBe(0);
  expect(result.stderr.toString()).toBe("");
  expect(result.stdout.toString().split("\n")).toHaveLength(2);
  expect(JSON.parse(result.stdout.toString())).toEqual({ hookSpecificOutput: {
    hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: 'a "quoted" \\ reasonwithcontrols',
  } });
});
test("deny uses the caller fallback or a safe default", () => {
  expect(JSON.parse(deny(undefined, "Cannot verify").stdout.toString()).hookSpecificOutput.permissionDecisionReason).toBe("Cannot verify");
  expect(JSON.parse(deny().stdout.toString()).hookSpecificOutput.permissionDecisionReason).toBe("Could not verify this call safely.");
});
