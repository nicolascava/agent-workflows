#!/usr/bin/env bun
import { readFileSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { baseBranch, commands, git, guard, repository } from "../lib/guard-policy";
import { deny } from "../lib/hook-runtime";
import { isRecord } from "../lib/is-record";
import type { Invocation } from "../lib/shell-commands";

const rawReview = "Raw PR review writes are blocked. Show the user the exact review payload, then post it through a review-write guard. Set AGENT_WORKFLOWS_ALLOW_RAW_REVIEW=1 in the environment launching Claude Code if you run your own.";
const reviewEndpoint = /^\/?(?:api\/v3\/)?(?:repos\/(?:[^/]+\/)?[^/]+\/)?pulls\/(?:[^/]+\/(?:reviews|comments)|comments\/[^/?#]+(?!\/reactions))(?:[/?#]|$)/;
const graphqlEndpoint = /^\/?(?:api\/)?graphql(?:[?#]|$)/;
const reviewMutation = /\b(?:add|submit|update|delete|dismiss)PullRequestReview\w*/;
const reviewTool = /^mcp__[^\s]*github[^\s]*__(?!get_|list_|search_|request_|(?:un)?resolve_)\w*(?:review|reply_to_pull_request_comment)\w*$/;
// Options whose value is the next word unless attached. A URL host or leading variable is dropped from endpoints.
const clients = {
  gh: { method: ["-X", "--method"], body: ["-f", "-F", "--field", "--raw-field", "--input"], value: ["-H", "--header", "-p", "--preview", "-q", "--jq", "-t", "--template", "--cache"], get: [] },
  curl: { method: ["-X", "--request"], body: ["-d", "--data", "--data-ascii", "--data-binary", "--data-raw", "--data-urlencode", "--json", "-F", "--form", "-T", "--upload-file"], value: ["-H", "--header"], get: ["-G", "--get"] },
};
const host = /^(?:https?:\/\/[^/]+|[\w-]+(?:\.[\w-]+)+(?::\d+)?(?=\/)|\$\{?\w+\}?(?=\/))/;

// `gh api` and curl send GET unless they carry a body, and an explicit method wins.
function writesReview(call: Invocation, text: string): boolean {
  if (call.program === "gh" && call.args[0] === "pr") return call.args[1] === "review";
  const gh = call.program === "gh" && call.args[0] === "api";
  if (!gh && call.program !== "curl") return false;
  const client = clients[gh ? "gh" : "curl"];
  const args = call.args.slice(gh ? 1 : 0);
  let method: string | undefined; let get = false;
  const bodies: [string, string, boolean][] = []; const endpoints: string[] = [];
  for (let i = 0; i < args.length; i++) {
    let arg = args[i]!;
    // curl reads a short-flag bundle such as -sX up to its first option that takes a value; the rest is that value.
    if (!gh && /^-[a-zA-Z]/.test(arg)) {
      const at = arg.search(/[AbcCdDeEFHKmoPQrtTuUwxXyYz]/);
      if (arg.slice(1, at < 0 ? undefined : at).includes("G")) get = true;
      if (at > 1) arg = `-${arg.slice(at)}`;
    }
    if (client.get.includes(arg)) { get = true; continue; }
    const flag = [...client.method, ...client.body, ...client.value].find(f => arg === f || arg.startsWith(f.startsWith("--") ? `${f}=` : f));
    if (!flag) { if (!arg.startsWith("-")) endpoints.push(arg); continue; }
    const word = arg === flag ? args[++i] ?? "" : args[i]!;
    const value = arg === flag ? word : arg.slice(flag.length).replace(/^=/, "");
    if (client.method.includes(flag)) method = value.toUpperCase();
    if (client.body.includes(flag)) bodies.push([flag, value, call.expanded.includes(word)]);
  }
  if ((method ?? (get || !bodies.length ? "GET" : "POST")) === "GET") return false;
  const paths = endpoints.map(e => e.replace(host, ""));
  // curl GraphQL calls count only toward a GitHub-like or variable host.
  if (paths.some(p => graphqlEndpoint.test(p)) && (gh || endpoints.some(e => /github|^\$|\/api\/graphql/.test(e)))) return writesReviewMutation(gh, bodies, text, call.directory);
  // gh only reaches GitHub, so an endpoint it cannot read counts as a review write.
  return paths.some(p => reviewEndpoint.test(p)) || (gh && /^\$/.test(paths[0] ?? ""));
}

// The command text covers inline and quoted-heredoc queries. A query from a file is read; one from a shell expansion,
// piped or redirected input, a here-string, an unquoted heredoc or a file it cannot locate or read counts as a review write.
function writesReviewMutation(gh: boolean, bodies: [string, string, boolean][], text: string, directory?: string): boolean {
  let seen = text;
  for (const [flag, value, expanded] of bodies) {
    let source = value;
    if (gh && flag !== "--input") { if (!value.startsWith("query=")) continue; source = value.slice(6); }
    if (expanded) return true;
    const named = (gh && flag === "--input") || flag === "-T" || flag === "--upload-file";
    const file = named ? source : source.startsWith("@") ? source.slice(1) : undefined;
    // Standard input is visible only as a quoted heredoc body.
    if (file === "-") { if (/<<<|<<-?\s*[^\s'"<-]|(?<!\|)\|(?!\|)\s*(?:\S*\/)?(?:gh|curl)\b/.test(text) || !/<<-?\s*['"]/.test(text)) return true; continue; }
    if (file !== undefined) {
      const path = directory ? resolve(directory, file) : isAbsolute(file) ? file : undefined;
      if (!path) return true;
      // Only a regular file is read; /dev/stdin, pipes and devices count as unreadable.
      try { if (!statSync(path).isFile()) return true; seen += readFileSync(path, "utf8"); } catch { return true; }
    }
  }
  return reviewMutation.test(seen);
}

export async function run(payload: Record<string, unknown>) {
  const allowRawReview = process.env.AGENT_WORKFLOWS_ALLOW_RAW_REVIEW === "1";
  if (!allowRawReview && reviewTool.test(String(payload.tool_name))) { deny(rawReview); return; }
  if (/^mcp__[^\s]*github[^\s]*__(?:merge_pull_request|mergePullRequest)$/.test(String(payload.tool_name)) && isRecord(payload.tool_input) && (payload.tool_input.admin === true || payload.tool_input.admin_override === true)) {
    await repository(payload); deny("Admin merge overrides are not allowed."); return;
  }
  const text = isRecord(payload.tool_input) ? String(payload.tool_input.command ?? "") : "";
  for (const call of commands(payload)) {
    if (!allowRawReview && writesReview(call, text)) { deny(rawReview); return; }
    if (call.program === "gh" && call.args[0] === "pr" && call.args[1] === "merge" && call.args.some(a => /^--admin(?:=|$)/.test(a))) {
      await repository(payload, call); deny("Admin merge overrides are not allowed."); return;
    }
    if (call.program !== "git" || call.args[0] !== "push") continue;
    const args = call.args.slice(1); if (args.includes("--dry-run") || args.includes("-n")) continue;
    const repo = await repository(payload, call);
    let base: string;
    try { base = await baseBranch(repo); }
    catch {
      // An undeclared base can only permit explicit feature destinations.
      const explicit = args.filter(a => !a.startsWith("-"));
      if (!args.some(a => /^--(?:all|mirror|force)|^-[+f]/.test(a)) && explicit.length >= 2 && explicit.slice(1).every(a => /^[^:]+:[^:*]+$/.test(a) && /\//.test(a.split(":")[1]!.replace(/^refs\/heads\//, "")))) continue;
      deny("Declare baseBranch before pushing an unresolved destination."); return;
    }
    const force = args.some(a => /^--force(?:-with-lease|-if-includes)?(?:=|$)|^-[a-z]*f[a-z]*$/.test(a));
    let broad = args.some(a => ["--all", "--mirror"].includes(a));
    let mirror = args.includes("--mirror");
    const positional: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]!;
      if (["--repo", "--receive-pack", "--exec", "--push-option", "-o"].includes(arg)) { if (arg === "--repo") positional.unshift(args[i + 1] ?? ""); i++; continue; }
      if (arg.startsWith("--repo=")) { positional.unshift(arg.slice(7)); continue; }
      if (arg === "--") { positional.push(...args.slice(i + 1)); break; }
      if (!arg.startsWith("-")) positional.push(arg);
    }
    let remote = positional.shift();
    if (!remote) {
      let current = ""; try { current = await git(repo.root, "symbolic-ref", "--short", "HEAD"); } catch {}
      for (const key of [current && `branch.${current}.pushRemote`, "remote.pushDefault", current && `branch.${current}.remote`]) {
        if (!key) continue;
        try { remote = await git(repo.root, "config", key); if (remote) break; } catch {}
      }
      remote ||= "origin";
    }
    let refs = positional;
    try { mirror ||= await git(repo.root, "config", "--bool", `remote.${remote}.mirror`) === "true"; } catch {}
    broad ||= mirror;
    if (!refs.length && args.includes("--tags") && !mirror && !args.includes("--all")) continue;
    if (!refs.length) {
      try { broad ||= await git(repo.root, "config", "push.default") === "matching"; } catch {}
      try { refs = (await git(repo.root, "config", "--get-all", `remote.${remote}.push`)).split("\n").filter(Boolean); } catch {}
    }
    if (!refs.length) {
      let current: string; try { current = await git(repo.root, "symbolic-ref", "--short", "HEAD"); } catch { deny("Use an explicit push destination."); return; }
      let upstream = current; try { upstream = (await git(repo.root, "config", `branch.${current}.merge`)).replace(/^refs\/heads\//, ""); } catch {}
      refs = [`${current}:${upstream}`];
    }
    const touchesBase = broad || refs.some(ref => {
      const destination = (ref.includes(":") ? ref.slice(ref.indexOf(":") + 1) : ref).replace(/^\+/, "").replace(/^refs\/heads\//, "");
      return destination === base || destination === "HEAD" || destination.includes("*") || destination === "";
    });
    if (touchesBase && (force || mirror || refs.some(r => r.startsWith("+")) || repo.config.workflow !== "solo-shaped-kanban")) {
      deny("Base pushes require {\"workflow\":\"solo-shaped-kanban\"} in git-workflow.json and must not force or mirror updates."); return;
    }
  }
}
if (import.meta.main) await guard(run);
