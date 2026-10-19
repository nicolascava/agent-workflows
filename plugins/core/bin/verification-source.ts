#!/usr/bin/env bun
import { realpathSync } from "node:fs";
import { randomUUID } from "node:crypto";

const env = {
  ...process.env,
  GIT_TERMINAL_PROMPT: "0",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
};

function git(...args: string[]): string {
  const result = Bun.spawnSync([
    "git", "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args,
  ], { env, timeout: 30_000 });
  if (result.exitCode !== 0) {
    // Remote diagnostics may contain credentials. Report the operation only.
    throw new Error(`git ${args[0]} failed; check repository, access, and branch`);
  }
  return result.stdout.toString();
}

function commitOid(ref: string): string {
  let oid: string;
  try {
    oid = git("rev-parse", "--verify", ref).trim();
  } catch {
    throw new Error("cannot resolve HEAD or fetched base to an immutable commit");
  }
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(oid) || git("cat-file", "-t", oid).trim() !== "commit") {
    throw new Error("expected one full immutable commit OID");
  }
  return oid;
}

function snapshot() {
  return {
    headOid: commitOid("HEAD"),
    treeOid: git("rev-parse", "--verify", "HEAD^{tree}").trim(),
    status: git("status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignore-submodules=none"),
  };
}

function main() {
  for (const key of Object.keys(process.env)) {
    if (/^GIT_(?:DIR|WORK_TREE|COMMON_DIR|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|NAMESPACE|SHALLOW_FILE|REPLACE_REF_BASE|CONFIG.*)$/.test(key)) {
      throw new Error("repository-routing environment override is not allowed");
    }
  }
  const options = new Map<string, string>();
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]!;
    const value = args[index + 1];
    if (!["--base", "--remote"].includes(key) || options.has(key) || !value || value.startsWith("-")) {
      throw new Error("usage: verification-source.ts --base <branch> [--remote <name>]");
    }
    options.set(key, value);
  }
  const base = options.get("--base");
  if (!base || base === "HEAD" || (base.startsWith("refs/") && !base.startsWith("refs/heads/"))) {
    throw new Error("base must be an explicit branch, not a symbolic ref or revision expression");
  }
  const baseRef = base.startsWith("refs/heads/") ? base : `refs/heads/${base}`;
  git("check-ref-format", baseRef);
  const remote = options.get("--remote") ?? "origin";
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(remote)) throw new Error("invalid remote name");

  if (git("rev-parse", "--is-inside-work-tree").trim() !== "true") throw new Error("current directory is not a worktree");
  const root = realpathSync(git("rev-parse", "--show-toplevel").trim());
  const before = snapshot();
  const urls = git("remote", "get-url", "--all", remote).trim().split("\n");
  if (urls.length !== 1 || !urls[0]) throw new Error("remote must have exactly one fetch URL");

  // A unique ref binds this fetch to its result without trusting FETCH_HEAD or
  // updating configured tracking refs. No cached result is used after failure.
  const fetchedRef = `refs/core-verification/${randomUUID()}`;
  let baseOid: string;
  try {
    git(
      "fetch", "--no-tags", "--no-recurse-submodules", "--no-auto-maintenance",
      "--no-write-commit-graph", "--no-write-fetch-head", "--refmap=",
      remote, `${baseRef}:${fetchedRef}`,
    );
    baseOid = commitOid(fetchedRef);
  } finally {
    git("update-ref", "-d", fetchedRef);
  }
  const after = snapshot();
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("worktree changed during evidence collection; retry");
  if (git("remote", "get-url", "--all", remote).trim() !== urls[0]) throw new Error("remote changed during evidence collection; retry");
  return { status: "ready", mode: "current-worktree", root, headOid: before.headOid, treeOid: before.treeOid, dirty: before.status.length > 0, remote, baseRef, baseOid };
}

try {
  console.log(JSON.stringify(main()));
} catch (error) {
  console.error(`verification-source: ${error instanceof Error ? error.message : "evidence collection failed"}`);
  process.exitCode = 1;
}
