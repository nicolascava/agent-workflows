#!/usr/bin/env bun
import { realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { git } from "../lib/guard-policy";
import { containsPath, projectDirectory, sessionContext } from "../lib/hook-runtime";
import { rejectGitOverrides } from "../lib/git-environment";
import { runBounded } from "../lib/bounded-command";

export async function run(payload: Record<string, unknown>) {
  rejectGitOverrides();
  const context = (text: string) => sessionContext(text, payload.hook_event_name === "PostToolUse" ? "PostToolUse" : "SessionStart");
  const cwd = projectDirectory(payload);
  const root = realpathSync(await git(cwd, "rev-parse", "--show-toplevel"));
  const common = realpathSync(await git(root, "rev-parse", "--path-format=absolute", "--git-common-dir"));
  const own = realpathSync(await git(root, "rev-parse", "--absolute-git-dir"));
  if (own === common || await git(root, "config", "--local", "--get", "extensions.worktreeConfig") !== "true") return;
  // Do not activate dormant worktree config or override global hook setups.
  const config = (...args: string[]) => runBounded(["git", "config", ...args], { cwd: root, timeout: 800 }).then(s => s.trim());
  try { await config("--worktree", "--get", "core.hooksPath"); return; } catch {}
  const configured = await config("--local", "--show-scope", "--get", "core.hooksPath");
  const match = /^local\s+(.+)$/.exec(configured); if (!match || !isAbsolute(match[1]!)) return;
  // Only the standard primary checkout layout can be mapped without guessing.
  if (!common.endsWith("/.git")) return;
  const primary = realpathSync(dirname(common));
  const original = realpathSync(match[1]!);
  if (!containsPath(primary, original) || original === primary || containsPath(common, original)) return;
  const path = relative(primary, original);
  let target: string;
  try { target = realpathSync(join(root, path)); }
  catch { context("The declared Git hooks directory is missing in this worktree. Run the repository's documented hooks setup. No dependencies were installed."); return; }
  if (!containsPath(root, target) || !statSync(target).isDirectory()) return;
  await git(root, "config", "--worktree", "core.hooksPath", path);
  context("Restored the repository's declared Git hooks path for this worktree.");
}
