#!/usr/bin/env bun
import { baseBranch, commands, git, guard, repository } from "../lib/guard-policy";
import { deny } from "../lib/hook-runtime";
import { isRecord } from "../lib/is-record";
import type { Invocation } from "../lib/shell-commands";

const rawReview = "Raw PR review writes are blocked. Show the user the exact review payload, then post it through a review-write guard. Set AGENT_WORKFLOWS_ALLOW_RAW_REVIEW=1 in the environment launching Claude Code if you run your own.";
const reviewEndpoint = /^\/?repos\/(?:[^/]+\/)?[^/]+\/pulls\/(?:[^/]+\/(?:reviews|comments)|comments\/[^/]+)(?:\/|$)/;
const reviewMutation = /\b(?:add|submit|update|delete|dismiss)PullRequestReview\w*/;
const reviewTool = /^mcp__[^\s]*github[^\s]*__(?!get_|list_|search_)\w*(?:review|reply_to_pull_request_comment)\w*$/;

// `gh api` sends GET unless it carries fields or an input body, and an explicit method wins.
function writesReview(call: Invocation): boolean {
  if (call.program !== "gh") return false;
  let args = call.args;
  while (/^(?:-R|--repo)$/.test(args[0] ?? "")) args = args.slice(2);
  while (/^--repo=/.test(args[0] ?? "")) args = args.slice(1);
  if (args[0] === "pr") return args[1] === "review";
  if (args[0] !== "api") return false;
  if (args.includes("graphql")) return args.some(a => reviewMutation.test(a));
  let method: string | undefined; let body = false;
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]!;
    const explicit = /^(?:-X|--method)(?:=)?(.*)$/.exec(arg);
    if (explicit) { method = (explicit[1] || args[++i] || "").toUpperCase(); continue; }
    if (/^(?:-[fF]|--field|--raw-field|--input)/.test(arg)) body = true;
  }
  return (method ?? (body ? "POST" : "GET")) !== "GET" && args.some(a => reviewEndpoint.test(a));
}

export async function run(payload: Record<string, unknown>) {
  const allowRawReview = process.env.AGENT_WORKFLOWS_ALLOW_RAW_REVIEW === "1";
  if (!allowRawReview && reviewTool.test(String(payload.tool_name))) { deny(rawReview); return; }
  if (/^mcp__[^\s]*github[^\s]*__(?:merge_pull_request|mergePullRequest)$/.test(String(payload.tool_name)) && isRecord(payload.tool_input) && (payload.tool_input.admin === true || payload.tool_input.admin_override === true)) {
    await repository(payload); deny("Admin merge overrides are not allowed."); return;
  }
  for (const call of commands(payload)) {
    if (!allowRawReview && writesReview(call)) { deny(rawReview); return; }
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
