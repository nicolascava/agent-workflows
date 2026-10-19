#!/usr/bin/env bun
import { git } from "../lib/guard-policy";
import { projectDirectory, sessionContext } from "../lib/hook-runtime";

export async function run(payload: Record<string, unknown>) {
  const raw = process.env.GIT_FLOW_WORKTREE_BUDGET;
  const budget = raw !== undefined && /^(?:0|[1-9][0-9]*)$/.test(raw) && Number.isSafeInteger(Number(raw)) ? Number(raw) : 20;
  if (budget === 0) return;
  const list = await git(projectDirectory(payload), "worktree", "list", "--porcelain", "-z");
  const count = list.split("\0").filter(line => line.startsWith("worktree ")).length;
  if (count > budget) sessionContext(`This repository has ${count} registered worktrees, above the budget of ${budget}. Inspect git worktree list. Use git worktree prune to remove stale registrations after checking their paths.`);
}
