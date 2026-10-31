#!/usr/bin/env bun
import { commands, guard, repository } from "../lib/guard-policy";
import { deny } from "../lib/hook-runtime";
import { isAgentName } from "../bin/workflow-mode";

function createdBranches(args: string[]): string[] {
  const [verb, ...rest] = args;
  if (["switch", "checkout", "worktree"].includes(verb ?? "")) {
    if (verb === "worktree" && rest[0] !== "add") return [];
    const names: string[] = [];
    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i]!;
      if (["-c", "-C", "-b", "-B", "--create", "--force-create", "--orphan"].includes(arg)) names.push(rest[++i] ?? "");
      else if (/^-[qdfm]*[cCbB]/.test(arg)) {
        const attached = /^-[qdfm]*[cCbB](.*)$/.exec(arg)![1]!;
        names.push(attached || rest[++i] || "");
      }
      else if (/^--(?:create|force-create|orphan)=/.test(arg)) names.push(arg.slice(arg.indexOf("=") + 1));
    }
    return names;
  }
  if (verb !== "branch" || !rest.length) return [];
  if (rest.some(a => /^(?:--(?:list|show-current|delete|move|copy|edit-description|set-upstream-to|unset-upstream|contains|no-contains|merged|no-merged|points-at|format|sort|column)(?:=|$)|-[dDmMcCavrl])/.test(a))) return [];
  return rest.filter(a => !a.startsWith("-")).slice(0, 1);
}
export async function run(payload: Record<string, unknown>) {
  for (const call of commands(payload)) {
    if (call.program !== "git") continue;
    const names = createdBranches(call.args); if (!names.length) continue;
    const { config } = await repository(payload, call);
    for (const name of names) {
      if (!name || isAgentName(name)) { deny("Use a contributor branch prefix, not an agent prefix."); return; }
      if (config.branchPrefix && !new RegExp(`^${config.branchPrefix}/[a-z0-9]+(?:-[a-z0-9]+)*$`).test(name)) { deny("Use the declared branchPrefix followed by a lowercase hyphenated slug."); return; }
    }
  }
}
if (import.meta.main) await guard(run);
