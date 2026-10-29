#!/usr/bin/env bun
import { ask, commands, guard, repository } from "../lib/guard-policy";
import { deny } from "../lib/hook-runtime";
import type { Invocation } from "../lib/shell-commands";

type Creation = "repository" | "pull-request" | "issue";
function toolCreation(name: string): Creation | undefined {
  if (!/^mcp__[^\s]*github[^\s]*__/i.test(name)) return;
  const action = name.slice(name.lastIndexOf("__") + 2).replace(/[_-]/g, "").toLowerCase();
  if (/^create(?:repository|repo)$/.test(action)) return "repository";
  if (/^(?:createpullrequest|pullrequestcreate)$/.test(action)) return "pull-request";
  if (/^(?:createissue|issuecreate)$/.test(action)) return "issue";
}
function commandCreations(call: Invocation): Creation[] {
  if (call.program !== "gh") return [];
  const [verb, action] = call.args;
  if (action === "create") {
    if (verb === "repo") return ["repository"];
    if (verb === "pr") return ["pull-request"];
    if (verb === "issue") return ["issue"];
  }
  if (verb !== "api") return [];
  const args = call.args.slice(1), all = args.join(" ");
  const creations: Creation[] = [];
  if (/\bmutation\b/.test(all)) {
    if (/\bcreateRepository\s*\(/.test(all)) creations.push("repository");
    if (/\bcreatePullRequest\s*\(/.test(all)) creations.push("pull-request");
    if (/\bcreateIssue\s*\(/.test(all)) creations.push("issue");
  }
  let method: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (["-X", "--method"].includes(args[i]!)) method = args[++i]?.toUpperCase();
    else if (/^(?:-X.|--method=)/.test(args[i]!)) method = args[i]!.replace(/^(?:-X|--method=)/, "").toUpperCase();
  }
  const writes = method ? !["GET", "HEAD", "OPTIONS"].includes(method) : args.some(a => /^(?:-[fF]|--(?:raw-field|field|input)(?:=|$))/.test(a));
  if (writes) {
    const endpoints = args.map(a => a.split("?")[0]!);
    if (endpoints.some(a => /^(?:https:\/\/[^/]+\/)?\/?(?:user\/repos|orgs\/[^/]+\/repos)\/?$/.test(a))) creations.push("repository");
    if (endpoints.some(a => /^(?:https:\/\/[^/]+\/)?\/?repos\/[^/]+\/[^/]+\/pulls\/?$/.test(a))) creations.push("pull-request");
    if (endpoints.some(a => /^(?:https:\/\/[^/]+\/)?\/?repos\/[^/]+\/[^/]+\/issues\/?$/.test(a))) creations.push("issue");
  }
  return creations;
}

const workflowRequired = "PR creation requires {\"workflow\":\"pr\"} in git-workflow.json at the repository root. In solo-shaped-kanban mode, land instead.";

export async function run(payload: Record<string, unknown>) {
  const calls: { kinds: string[]; call?: Invocation }[] = [];
  const tool = toolCreation(String(payload.tool_name)); if (tool) calls.push({ kinds: [tool] });
  for (const call of commands(payload)) { const kinds = commandCreations(call); if (kinds.length) calls.push({ kinds, call }); }
  let createsRepository = false;
  for (const { kinds, call } of calls) {
    if (call?.dynamic && call.args[0] === "pr") {
      // The call is denied either way; the literal directory only picks the more useful reason.
      const resolved = await repository(payload, { ...call, unsafe: false }).catch(() => undefined);
      if (resolved && kinds.includes("pull-request") && resolved.config.workflow !== "pr") { deny(workflowRequired); return; }
      deny("Shell quoting, not the title copy, blocked this call: a `$` or backtick outside single quotes runs as shell expansion. Keep backticks around code names and single-quote the text, as in --title 'Set `name` as the base branch', or pass the body with --body-file."); return;
    }
    const { config } = await repository(payload, call);
    if (kinds.includes("pull-request") && config.workflow !== "pr") { deny(workflowRequired); return; }
    if (kinds.includes("repository")) createsRepository = true;
  }
  if (createsRepository && process.env.AGENT_WORKFLOWS_ALLOW_REPO_CREATE !== "1") ask("Confirm the target and visibility before creating a repository.");
}
if (import.meta.main) await guard(run);
