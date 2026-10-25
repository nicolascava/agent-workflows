import { afterEach, expect, test } from "bun:test";
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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
// Only declaration failures carry the setup hint; command and remote failures do not.
function fail(r: ReturnType<ReturnType<typeof fixture>["run"]>, hint = true) {
  expect(r.exitCode).not.toBe(0); expect(r.stdout.toString()).toBe("");
  if (hint) expect(r.stderr.toString()).toContain("git-workflow.json");
  else expect(r.stderr.toString()).not.toContain("git-workflow.json");
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
test("accepts a full land declaration without changing the helper output", () => {
  const f = fixture();
  f.config({ workflow: "solo-shaped-kanban", land: { quality: [["bun", "test"], ["bun", "scripts/leak-scan.ts"], ["bun", "run", "validate"]], deploy: "push-triggered" } });
  const r = f.run();
  expect(r.stderr.toString()).toBe("");
  expect(r.exitCode).toBe(0);
  expect(JSON.parse(r.stdout.toString())).toEqual({ root: f.root, workflow: "solo-shaped-kanban", baseBranch: "trunk", branchPrefix: "developer", remote: "origin" });
});
test("accepts land with only deploy, only quality or no settings", () => {
  const f = fixture();
  for (const land of [{ deploy: "nca-deploy-worker" }, { deploy: "push-triggered" }, { quality: [["bun", "test"]] }, {}]) {
    f.config({ workflow: "pr", land });
    const r = f.run();
    expect(r.stderr.toString()).toBe("");
    expect(r.exitCode).toBe(0);
    expect(JSON.parse(r.stdout.toString())).toEqual({ root: f.root, workflow: "pr", baseBranch: "trunk", branchPrefix: "developer", remote: "origin" });
  }
});
for (const [name, land] of Object.entries({
  array: [], null: null, string: "land", "unknown key": { extra: true },
  "empty quality": { quality: [] }, "non-array quality": { quality: "bun test" },
  "null quality": { quality: null }, "empty argv": { quality: [[]] },
  "non-array argv": { quality: ["bun"] }, "null argv": { quality: [null] },
  "non-string argument": { quality: [["bun", 1]] }, "empty argument": { quality: [["bun", ""]] },
  "unknown deploy": { deploy: "other" }, "null deploy": { deploy: null },
})) {
  test(`rejects land with ${name}`, () => {
    const f = fixture(); f.config({ workflow: "pr", land }); fail(f.run());
  });
}
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
test("resolves an absent declaration as pr with live discovery", () => {
  const f = fixture(); const r = f.run();
  expect(r.exitCode).toBe(0);
  expect(JSON.parse(r.stdout.toString())).toEqual({ root: f.root, workflow: "pr", baseBranch: "trunk", branchPrefix: "developer", remote: "origin" });
});
test("fails closed for invalid, unknown and incomplete declarations", () => {
  const f = fixture();
  for (const data of [{}, { workflow: "other" }, [], null, { workflow: "pr", extra: true }, { workflow: "pr", baseBranch: "HEAD" }, { workflow: "pr", baseBranch: "main:other" }, { workflow: "pr", branchPrefix: "" }]) {
    f.config(data); fail(f.run());
  }
  writeFileSync(join(f.root, "git-workflow.json"), "{"); fail(f.run());
});
test("rejects agent branch prefixes from every source", () => {
  const f = fixture();
  for (const name of ["claude", "codex", "gemini", "agent", "worktree-123"]) {
    f.config({ workflow: "pr", branchPrefix: name }); fail(f.run());
    f.config({ workflow: "pr" }); fail(f.run([], { FAKE_LOGIN: name }), false);
  }
});
test("fails when no remote default can be verified instead of guessing main", () => {
  const f = fixture(); f.config({ workflow: "pr" }); f.git("remote", "remove", "origin"); fail(f.run(), false);
});
test("accepts a selected remote and rejects unknown or duplicate options", () => {
  const f = fixture(); f.config({ workflow: "pr" }); f.git("remote", "rename", "origin", "upstream");
  expect(f.run(["--remote", "upstream"]).exitCode).toBe(0);
  for (const args of [["--other"], ["--remote"], ["--remote", "upstream", "--remote", "upstream"], ["--remote", "--all"]]) fail(f.run(args), false);
});
test("reports a missing command instead of an invalid declaration", () => {
  const f = fixture(); f.config({ workflow: "pr" });
  const r = f.run([], { PATH: join(f.root, "fake-bin") }); fail(r, false);
  expect(r.stderr.toString()).toContain("command unavailable");
  expect(r.stderr.toString()).not.toContain("invalid declaration");
});
test("fails closed for a symlinked or directory declaration", () => {
  const f = fixture();
  writeFileSync(join(f.root, "target.json"), '{"workflow":"pr"}');
  symlinkSync(join(f.root, "target.json"), join(f.root, "git-workflow.json")); fail(f.run());
  rmSync(join(f.root, "git-workflow.json")); mkdirSync(join(f.root, "git-workflow.json")); fail(f.run());
  rmSync(join(f.root, "git-workflow.json"), { recursive: true });
  expect(Bun.spawnSync(["mkfifo", join(f.root, "git-workflow.json")]).exitCode).toBe(0); fail(f.run());
});
// Root can read a mode-0 file, so this check only means something for other users.
test.skipIf(process.getuid?.() === 0)("reports an unreadable declaration without echoing its path", () => {
  const f = fixture(); f.config({ workflow: "pr" }); chmodSync(join(f.root, "git-workflow.json"), 0);
  const r = f.run(); fail(r);
  expect(r.stderr.toString()).toContain("cannot read declaration");
  expect(r.stderr.toString()).not.toContain(f.root);
});
test("labels an unresolvable repository root without the setup hint", () => {
  const f = fixture(); const shim = join(f.root, "shim-bin"); mkdirSync(shim);
  writeFileSync(join(shim, "git"), '#!/bin/sh\ncase "$*" in *--is-inside-work-tree*) echo true;; *--show-toplevel*) echo /nonexistent-workflow-mode-root;; *) exit 1;; esac\n');
  chmodSync(join(shim, "git"), 0o755);
  const r = f.run([], { PATH: `${shim}:${process.env.PATH}` }); fail(r, false);
  expect(r.stderr.toString()).toContain("cannot resolve repository root");
});
test("rejects repository routing overrides", () => {
  const f = fixture(); f.config({ workflow: "pr" }); fail(f.run([], { GIT_WORK_TREE: f.root }), false);
});
