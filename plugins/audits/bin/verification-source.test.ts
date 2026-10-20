import { afterEach, describe, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const helper = resolve(import.meta.dir, "verification-source.ts");
const temporary: string[] = [];
// A linked worktree has a `.git` file, so ask Git where its directory is.
const gitDir = Bun.spawnSync(["git", "rev-parse", "--absolute-git-dir"], { cwd: import.meta.dir }).stdout.toString().trim();
const localGitEnv = { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_ALLOW_PROTOCOL: "file" };

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd, env: localGitEnv });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
  return result.stdout.toString().trim();
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(gitDir, "audits-source-")));
  temporary.push(root);
  const upstream = join(root, "upstream.git");
  const work = join(root, "current worktree");
  git(root, "init", "--bare", "--initial-branch=main", upstream);
  git(root, "clone", upstream, work);
  git(work, "config", "user.name", "Test author");
  git(work, "config", "user.email", "author@example.com");
  writeFileSync(join(work, "file.txt"), "initial\n");
  git(work, "add", ".");
  git(work, "commit", "-m", "Create fixture");
  git(work, "push", "origin", "main");
  return { root, upstream, work, oid: git(work, "rev-parse", "HEAD") };
}

function run(cwd: string, args = ["--base", "main"], env: Record<string, string> = {}) {
  return Bun.spawnSync([process.execPath, helper, ...args], { cwd, env: { ...localGitEnv, ...env } });
}

function ready(cwd: string, args?: string[]) {
  const result = run(cwd, args);
  expect(result.stderr.toString()).toBe("");
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout.toString());
}

function blocked(result: ReturnType<typeof run>, reason: RegExp) {
  expect(result.exitCode).not.toBe(0);
  expect(result.stdout.toString()).toBe("");
  expect(result.stderr.toString()).toMatch(reason);
}

describe("current-worktree verification source", () => {
  test("pins the explicit remote branch while leaving the subject untouched", () => {
    const { work, oid } = fixture();
    const result = ready(work);
    expect(result).toMatchObject({ status: "ready", mode: "current-worktree", root: work, headOid: oid, baseOid: oid, dirty: false, remote: "origin", baseRef: "refs/heads/main" });
    expect(result.treeOid).toBe(git(work, "rev-parse", "HEAD^{tree}"));
    expect(git(work, "rev-parse", "HEAD")).toBe(oid);
    expect(git(work, "status", "--porcelain")).toBe("");
    expect(git(work, "for-each-ref", "--format=%(refname)", "refs/audits-verification/")).toBe("");
  });

  test("refreshes the base rather than reusing an earlier fetched OID", () => {
    const { root, upstream, work, oid } = fixture();
    expect(ready(work).baseOid).toBe(oid);
    const publisher = join(root, "publisher");
    git(root, "clone", upstream, publisher);
    git(publisher, "config", "user.name", "Test author");
    git(publisher, "config", "user.email", "author@example.com");
    writeFileSync(join(publisher, "file.txt"), "advanced\n");
    git(publisher, "commit", "-am", "Advance base");
    git(publisher, "push", "origin", "main");
    expect(ready(work)).toMatchObject({ headOid: oid, baseOid: git(publisher, "rev-parse", "HEAD") });
    expect(git(work, "show", "HEAD:file.txt")).toBe("initial");
  });

  test("uses the linked worktree that invoked it, including detached HEAD", () => {
    const { root, work, oid } = fixture();
    const linked = join(root, "linked");
    git(work, "worktree", "add", "--detach", linked, oid);
    mkdirSync(join(linked, "nested"));
    writeFileSync(join(work, "unrelated.txt"), "other checkout\n");
    expect(ready(join(linked, "nested"))).toMatchObject({ root: linked, headOid: oid, dirty: false });
  });

  test("reports unstaged, staged, and untracked changes without modifying them", () => {
    const { work } = fixture();
    writeFileSync(join(work, "file.txt"), "unstaged\n");
    expect(ready(work).dirty).toBe(true);
    git(work, "add", "file.txt");
    expect(ready(work).dirty).toBe(true);
    git(work, "reset", "--hard", "HEAD");
    writeFileSync(join(work, "new.txt"), "untracked\n");
    expect(ready(work).dirty).toBe(true);
    expect(git(work, "status", "--porcelain")).toBe("?? new.txt");
  });

  test("accepts a qualified branch and an explicit configured remote", () => {
    const { work, oid } = fixture();
    git(work, "remote", "rename", "origin", "upstream");
    expect(ready(work, ["--base", "refs/heads/main", "--remote", "upstream"]).baseOid).toBe(oid);
    blocked(run(work), /remote/i);
  });

  test("does not let a tag with the same name satisfy a missing branch", () => {
    const { work } = fixture();
    git(work, "tag", "release");
    git(work, "push", "origin", "refs/tags/release");
    blocked(run(work, ["--base", "release"]), /fetch/i);
  });

  test("fails closed when fetch fails even if old objects and FETCH_HEAD exist", () => {
    const { work, root } = fixture();
    git(work, "fetch", "origin", "main");
    git(work, "remote", "set-url", "origin", join(root, "missing.git"));
    blocked(run(work), /fetch/i);
    expect(git(work, "for-each-ref", "--format=%(refname)", "refs/audits-verification/")).toBe("");
  });

  test("preserves FETCH_HEAD and remote-tracking refs", () => {
    const { root, upstream, work, oid } = fixture();
    git(work, "fetch", "origin", "main");
    const fetched = git(work, "rev-parse", "FETCH_HEAD");
    const publisher = join(root, "publisher");
    git(root, "clone", upstream, publisher);
    git(publisher, "config", "user.name", "Test author");
    git(publisher, "config", "user.email", "author@example.com");
    writeFileSync(join(publisher, "file.txt"), "new base\n");
    git(publisher, "commit", "-am", "Advance base");
    git(publisher, "push", "origin", "main");
    expect(ready(work).baseOid).toBe(git(publisher, "rev-parse", "HEAD"));
    expect(git(work, "rev-parse", "FETCH_HEAD")).toBe(fetched);
    expect(git(work, "rev-parse", "refs/remotes/origin/main")).toBe(oid);
  });

  test("does not disclose remote URLs in failure diagnostics", () => {
    const { work, root } = fixture();
    git(work, "remote", "set-url", "origin", join(root, "secret-marker.git"));
    const result = run(work);
    blocked(result, /fetch/i);
    expect(result.stderr.toString()).not.toContain("secret-marker");
    expect(result.stderr.toString()).not.toContain(root);
  });

  test("rejects multiple fetch URLs instead of choosing one", () => {
    const { work, upstream } = fixture();
    git(work, "config", "--add", "remote.origin.url", upstream);
    blocked(run(work), /remote.*(one|single|ambiguous)/i);
  });

  test("rejects repository-routing environment overrides", () => {
    const { work } = fixture();
    blocked(run(work, undefined, { GIT_WORK_TREE: work }), /environment|override/i);
  });

  test("never executes configured repository hooks or file-system monitors", () => {
    const { root, work } = fixture();
    const hooks = join(root, "callbacks");
    mkdirSync(hooks);
    const hook = join(hooks, "reference-transaction");
    const monitor = join(hooks, "monitor");
    const hookMarker = join(root, "hook-ran");
    const monitorMarker = join(root, "monitor-ran");
    writeFileSync(hook, `#!/bin/sh\ntouch '${hookMarker}'\n`);
    writeFileSync(monitor, `#!/bin/sh\ntouch '${monitorMarker}'\nprintf 'token\\0'\n`);
    chmodSync(hook, 0o755);
    chmodSync(monitor, 0o755);
    git(work, "config", "core.hooksPath", hooks);
    git(work, "config", "core.fsmonitor", monitor);
    ready(work);
    expect(existsSync(hookMarker)).toBe(false);
    expect(existsSync(monitorMarker)).toBe(false);
  });

  test("rejects non-worktrees and unborn HEAD", () => {
    const { root, upstream } = fixture();
    blocked(run(root), /worktree|repository/i);
    blocked(run(upstream), /worktree/i);
    const empty = join(root, "empty");
    git(root, "init", "--initial-branch=main", empty);
    blocked(run(empty), /HEAD|commit/i);
  });

  test("rejects missing, duplicate, unknown, symbolic, and revision-expression inputs", () => {
    const { work } = fixture();
    for (const args of [[], ["--other"], ["--base"], ["--base", "main", "--base", "main"], ["--base", "HEAD"], ["--base", "refs/tags/main"], ["--base", "main^{commit}"], ["--base", "main:other"], ["--base", "--all"]]) {
      blocked(run(work, args), /usage|base|branch|argument/i);
    }
  });
});
