import { realpathSync } from "node:fs";
import { isAbsolute } from "node:path";
import { readWorkflowDeclaration, type WorkflowDeclaration } from "../bin/workflow-mode";
import { runBounded } from "./bounded-command";
import { deny, projectDirectory, readHookInput } from "./hook-runtime";
import { isRecord } from "./is-record";
import { rejectGitOverrides } from "./git-environment";
import { invocations, type Invocation } from "./shell-commands";

export const git = (cwd: string, ...args: string[]) => runBounded(["git", "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args], { cwd, timeout: 800 }).then(s => s.trim());
export type Repository = { root: string; config: WorkflowDeclaration };
export async function repository(payload: Record<string, unknown>, call?: Invocation): Promise<Repository> {
  rejectGitOverrides();
  if (payload.git_flow_repository_override) throw new Error("Repository-routing environment override");
  if (call?.unsafe) throw new Error("Cannot resolve dynamic command or repository override");
  const directory = call ? call.directory : projectDirectory(payload);
  if (!directory || !isAbsolute(directory)) throw new Error("Cannot resolve command directory");
  const cwd = realpathSync(directory);
  if (await git(cwd, "rev-parse", "--is-inside-work-tree") !== "true") throw new Error("Not a worktree");
  const root = realpathSync(await git(cwd, "rev-parse", "--show-toplevel"));
  return { root, config: readWorkflowDeclaration(root) };
}
export function commands(payload: Record<string, unknown>): Invocation[] {
  if (payload.tool_name !== "Bash") return [];
  if (!isRecord(payload.tool_input) || typeof payload.tool_input.command !== "string") throw new Error("Invalid shell input");
  // Defer root validation until a guarded command has been identified.
  let directory: string | undefined;
  try { directory = projectDirectory(payload); } catch {}
  try { return invocations(payload.tool_input.command, directory); }
  catch (error) {
    if (!/\b(?:git|gh)\b/.test(payload.tool_input.command)) return [];
    throw error;
  }
}
export function ask(reason: string) {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: reason } }));
}
export async function guard(policy: (payload: Record<string, unknown>) => Promise<void>) {
  try { await policy(await readHookInput()); } catch { deny(); }
}
export function baseBranch(repo: Repository): Promise<string> {
  if (repo.config.baseBranch) return Promise.resolve(repo.config.baseBranch);
  return git(repo.root, "symbolic-ref", "--short", "refs/remotes/origin/HEAD").then(value => {
    if (!value.startsWith("origin/")) throw new Error("Base branch unavailable"); return value.slice(7);
  });
}
