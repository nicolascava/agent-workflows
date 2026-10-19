import { afterEach, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const helper = resolve(import.meta.dir, "workflow-mode.ts");
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "workflow-mode-")));
  roots.push(root);
  const git = (...args: string[]) => {
    const r = Bun.spawnSync(["git", ...args], { cwd: root });
    if (r.exitCode) throw new Error(r.stderr.toString());
    return r.stdout.toString().trim();
  };
  git("init", "--initial-branch=trunk");
  git("config", "user.name", "Test Author");
  git("config", "user.email", "author@example.com");
  git("commit", "--allow-empty", "-m", "Create fixture");
  const remote = join(root, "remote.git");
  git("clone", "--bare", root, remote);
  git("remote", "add", "origin", remote);
  const bin = join(root, "fake-bin"); mkdirSync(bin);
  const gh = join(bin, "gh");
  writeFileSync(gh, '#!/bin/sh\n[ "$*" = "api user --jq .login" ] || exit 9\n[ "$FAKE_GH_FAIL" = "1" ] && exit 1\nprintf "%s\\n" "${FAKE_LOGIN:-developer}"\n');
  chmodSync(gh, 0o755);
  const config = (data: unknown) => writeFileSync(join(root, "git-workflow.json"), JSON.stringify(data));
  const run = (args: string[] = [], extra: Record<string, string> = {}, cwd = root) => Bun.spawnSync([process.execPath, helper, ...args], { cwd, env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, ...extra } });
  return { root, git, config, run };
}
function fail(r: ReturnType<ReturnType<typeof fixture>["run"]>) {
  expect(r.exitCode).not.toBe(0); expect(r.stdout.toString()).toBe("");
  expect(r.stderr.toString()).toContain("git-workflow.json");
}
test("resolves both declarations with live remote default and authenticated prefix", () => {
  const f = fixture();
  for (const workflow of ["pr", "solo-shaped-kanban"]) {
    f.config({ workflow }); const r = f.run();
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout.toString())).toEqual({ root: f.root, workflow, baseBranch: "trunk", branchPrefix: "developer", remote: "origin" });
  }
});
test("uses the repository root from a nested directory and explicit settings", () => {
  const f = fixture(); mkdirSync(join(f.root, "nested"));
  f.config({ workflow: "pr", baseBranch: "release/stable", branchPrefix: "maintainer" });
  const r = f.run([], {}, join(f.root, "nested"));
  expect(r.exitCode).toBe(0);
  expect(JSON.parse(r.stdout.toString())).toMatchObject({ baseBranch: "release/stable", branchPrefix: "maintainer" });
});
test("falls back to a slug of the Git author when gh is unavailable", () => {
  const f = fixture(); f.config({ workflow: "pr" });
  const r = f.run([], { FAKE_GH_FAIL: "1" }); expect(r.exitCode).toBe(0);
  expect(JSON.parse(r.stdout.toString()).branchPrefix).toBe("test-author");
});
test("resolves a linked worktree from its own declaration", () => {
  const f = fixture(); const linked = join(f.root, "linked"); f.git("worktree", "add", "--detach", linked);
  writeFileSync(join(linked, "git-workflow.json"), '{"workflow":"solo-shaped-kanban"}');
  const r = f.run([], {}, linked); expect(r.exitCode).toBe(0);
  expect(JSON.parse(r.stdout.toString()).root).toBe(linked);
});
test("fails closed for absent, invalid, unknown and incomplete declarations", () => {
  const f = fixture(); fail(f.run());
  for (const data of [{}, { workflow: "other" }, [], null, { workflow: "pr", extra: true }, { workflow: "pr", baseBranch: "HEAD" }, { workflow: "pr", baseBranch: "main:other" }, { workflow: "pr", branchPrefix: "" }]) {
    f.config(data); fail(f.run());
  }
  writeFileSync(join(f.root, "git-workflow.json"), "{"); fail(f.run());
});
test("rejects agent branch prefixes from every source", () => {
  const f = fixture();
  for (const name of ["claude", "codex", "gemini", "agent", "worktree-123"]) {
    f.config({ workflow: "pr", branchPrefix: name }); fail(f.run());
    f.config({ workflow: "pr" }); fail(f.run([], { FAKE_LOGIN: name }));
  }
});
test("fails when no remote default can be verified instead of guessing main", () => {
  const f = fixture(); f.config({ workflow: "pr" }); f.git("remote", "remove", "origin"); fail(f.run());
});
test("accepts a selected remote and rejects unknown or duplicate options", () => {
  const f = fixture(); f.config({ workflow: "pr" }); f.git("remote", "rename", "origin", "upstream");
  expect(f.run(["--remote", "upstream"]).exitCode).toBe(0);
  for (const args of [["--other"], ["--remote"], ["--remote", "upstream", "--remote", "upstream"], ["--remote", "--all"]]) fail(f.run(args));
});
test("rejects repository routing overrides", () => {
  const f = fixture(); f.config({ workflow: "pr" }); fail(f.run([], { GIT_WORK_TREE: f.root }));
});
