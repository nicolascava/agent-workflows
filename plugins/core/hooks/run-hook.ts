#!/usr/bin/env bun
import { realpathSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { containsPath, deny, hookRoot, localFile, readHookInput } from "../lib/hook-runtime";
import { runBounded } from "../lib/bounded-command";
import { isRecord } from "../lib/is-record";

const HOOK_NAMES = new Set(["documentation-guidance", "nextjs-context", "format-after-edit"]);

export function resolveHookPath(input: { dispatcherDir: string; name: string; projectDir?: string }): string | null {
  if (!HOOK_NAMES.has(input.name)) return null;
  try {
    const root = realpathSync(join(input.dispatcherDir, ".."));
    return localFile(root, `hooks/${input.name}.sh`, true);
  } catch { return null; }
}

async function runGuard(root: string, classifier: string | undefined, payload: Record<string, unknown>) {
  if (typeof payload.tool_name !== "string" || !payload.tool_name || !isRecord(payload.tool_input)) throw new Error("Invalid tool input");
  if (classifier === undefined || !classifier.startsWith("hooks/") || !classifier.endsWith(".ts")) throw new Error("Invalid policy path");
  const policy = localFile(root, classifier);
  // Only tools known to read without changing state can bypass a policy.
  if (["Read", "Glob", "Grep"].includes(payload.tool_name)) return;
  const text = (await runBounded([process.execPath, "--no-install", policy], {
    input: JSON.stringify(payload), timeout: 2000,
  })).trim();
  if (!text) return;
  const response: unknown = JSON.parse(text);
  if (!isRecord(response) || !isRecord(response.hookSpecificOutput)) throw new Error("Invalid policy response");
  const decision = response.hookSpecificOutput;
  if (decision.hookEventName !== "PreToolUse" || !["allow", "deny", "ask"].includes(String(decision.permissionDecision)) ||
      (decision.permissionDecisionReason !== undefined && typeof decision.permissionDecisionReason !== "string")) throw new Error("Invalid policy decision");
  console.log(JSON.stringify(response));
}

export async function runHook(name: string, args: string[] = []) {
  const guard = name === "--guard";
  try {
    const root = hookRoot();
    if (guard) {
      if (args.length !== 1) throw new Error("Invalid policy arguments");
      await runGuard(root, args[0], await readHookInput());
      return;
    }
    if (!HOOK_NAMES.has(name) || args.length || !resolveHookPath({ dispatcherDir: join(root, "hooks"), name })) return;
    if (name === "format-after-edit" && process.env.CORE_FORMAT_AFTER_EDIT !== "1") return;
    const implementation = localFile(root, `hooks/${name}.ts`);
    if (!containsPath(root, implementation)) return;
    const payload = await readHookInput();
    const module = await import(pathToFileURL(implementation).href);
    await module.run(payload, root);
  } catch {
    if (guard) deny();
    // Advisory hooks cannot stop a tool or emit partial context on bad input.
  }
}

if (import.meta.main) {
  await runHook(process.argv[2] ?? "", process.argv.slice(3));
  process.exit(0);
}
