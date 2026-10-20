#!/usr/bin/env bun
import { commandCreations, toolCreation } from "../lib/github-creation-guard";
import { ask, commands, guard, repository } from "../lib/guard-policy";
import { deny } from "../lib/hook-runtime";
import type { Invocation } from "../lib/shell-commands";

export async function run(payload: Record<string, unknown>) {
  const calls: { kinds: string[]; call?: Invocation }[] = [];
  const tool = toolCreation(String(payload.tool_name)); if (tool) calls.push({ kinds: [tool] });
  for (const call of commands(payload)) { const kinds = commandCreations(call); if (kinds.length) calls.push({ kinds, call }); }
  let createsRepository = false;
  for (const { kinds, call } of calls) {
    if (call?.dynamic && call.args[0] === "pr") { deny("Shell quoting, not the title copy, blocked this call: a `$` or backtick outside single quotes runs as shell expansion. Keep backticks around code names and single-quote the text, as in --title 'Set `name` as the base branch', or pass the body with --body-file."); return; }
    const { config } = await repository(payload, call);
    if (kinds.includes("pull-request") && config?.workflow !== "pr") { deny("PR creation requires {\"workflow\":\"pr\"} in git-workflow.json at the repository root. In solo-shaped-kanban mode, land instead."); return; }
    if (kinds.includes("repository")) createsRepository = true;
  }
  if (createsRepository && process.env.AGENT_WORKFLOWS_ALLOW_REPO_CREATE !== "1") ask("Confirm the target and visibility before creating a repository.");
}
if (import.meta.main) await guard(run);
