import type { Invocation } from "./shell-commands";

export type Creation = "repository" | "pull-request" | "issue";
export function toolCreation(name: string): Creation | undefined {
  if (!/^mcp__[^\s]*github[^\s]*__/i.test(name)) return;
  const action = name.slice(name.lastIndexOf("__") + 2).replace(/[_-]/g, "").toLowerCase();
  if (/^create(?:repository|repo)$/.test(action)) return "repository";
  if (/^(?:createpullrequest|pullrequestcreate)$/.test(action)) return "pull-request";
  if (/^(?:createissue|issuecreate)$/.test(action)) return "issue";
}
export function commandCreations(call: Invocation): Creation[] {
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
