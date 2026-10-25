import { afterEach, describe, expect, test, setDefaultTimeout } from "bun:test";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const plugin = resolve(import.meta.dir, "..");
setDefaultTimeout(15_000);
const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
function temp() { const path = mkdtempSync(join(tmpdir(), "git-flow-test-")); temporary.push(path); return path; }
function git(cwd: string, ...args: string[]) {
  const result = spawnSync("git", [...(args[0] === "config" ? [] : ["-c", "core.hooksPath=/dev/null"]), ...args], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}
function repo(mode?: string, prefix?: string) {
  const cwd = temp(); git(cwd, "init", "-b", "trunk");
  git(cwd, "-c", "user.name=Example Contributor", "-c", "user.email=dev@example.com", "commit", "--allow-empty", "-m", "Initialize");
  if (mode) writeFileSync(join(cwd, "git-workflow.json"), JSON.stringify({ workflow: mode, baseBranch: "trunk", ...(prefix ? { branchPrefix: prefix } : {}) }));
  return cwd;
}
function hook(name: string, cwd: string, input: unknown, env: Record<string, string> = {}, root = plugin) {
  const result = spawnSync("/bin/bash", [join(root, "hooks", `${name}.sh`)], {
    cwd, input: typeof input === "string" ? input : JSON.stringify(input), encoding: "utf8", timeout: 6000,
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root, AGENT_WORKFLOWS_ALLOW_REPO_CREATE: "", ...env },
  });
  expect(result.error).toBeUndefined(); expect(result.status).toBe(0); expect(result.stderr).toBe("");
  return result.stdout.trim() ? JSON.parse(result.stdout).hookSpecificOutput : undefined;
}
const bash = (cwd: string, command: string) => ({ cwd, tool_name: "Bash", tool_input: { command } });
const decision = (output: any) => output?.permissionDecision;

describe("branch prefix guard", () => {
  for (const mode of [undefined, "pr", "solo-shaped-kanban"]) {
    for (const command of ["git switch -c claude/fix", "git checkout -b codex/fix", "git branch agent/fix", "git worktree add -b assistant/fix ../new", "git switch -c gemini-fix"]) {
      test(`${mode ?? "undeclared (pr)"}: denies ${command}`, () => { const cwd = repo(mode, "developer"); expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, command)))).toBe("deny"); });
    }
    test(`${mode ?? "undeclared (pr)"}: contributor branch`, () => { const cwd = repo(mode, "developer"); expect(hook("guard-branch-prefix", cwd, bash(cwd, "git switch -c developer/fix-login"))).toBeUndefined(); });
  }
  test("declared prefix is required, but a missing prefix is not inferred", () => {
    const cwd = repo("pr", "developer");
    for (const name of ["other/fix", "developer/", "developer/fix/extra", "developer/UPPER"]) expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, `git branch ${name}`)))).toBe("deny");
    writeFileSync(join(cwd, "git-workflow.json"), '{"workflow":"pr"}');
    expect(hook("guard-branch-prefix", cwd, bash(cwd, "git branch feature/anything"))).toBeUndefined();
    rmSync(join(cwd, "git-workflow.json"));
    expect(hook("guard-branch-prefix", cwd, bash(cwd, "git branch feature/anything"))).toBeUndefined();
  });
  test("option variants and shell wrappers are checked", () => {
    const cwd = repo("pr", "developer");
    for (const command of ["git switch -cclaude/fix", "git checkout -bcodex/fix", "git worktree add --detach -bclaude/fix ../new", "env EXAMPLE=1 git branch claude/fix", "bash -c 'git switch -c claude/fix'", "echo ok && git branch claude/fix", "echo $(git branch claude/fix)"]) expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, command)))).toBe("deny");
  });
  test("shell control words and combined creation flags are checked", () => {
    const cwd = repo("pr", "developer");
    for (const command of ["if true; then git branch claude/fix; fi", "{ git branch claude/fix; }", "git checkout -qb claude/fix", "git switch -qc codex/fix"]) expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, command)))).toBe("deny");
  });
  test("shell line continuations preserve the guarded command", () => {
    const cwd = repo("pr", "developer");
    expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, "git \\\n branch claude/fix")))).toBe("deny");
  });
  test("read operations and quoted text do not trigger", () => {
    const cwd = repo("pr", "developer");
    for (const command of ["echo 'git branch claude/fix'", "git branch --list claude/fix", "git branch -d old", "git switch existing", "git status", "git branch --show-current"]) expect(hook("guard-branch-prefix", cwd, bash(cwd, command))).toBeUndefined();
  });
  test("command cwd and git -C bind the declaration", () => {
    const cwd = repo("pr", "developer"), other = repo("pr", "other");
    for (const command of [`git -C '${other}' branch developer/fix`, `cd '${other}' && git branch developer/fix`]) expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, command)))).toBe("deny");
  });
  test("git -C does not leak into later commands and unresolved shell state denies", () => {
    const cwd = repo("pr", "developer"), other = repo("pr", "other");
    expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, `git -C '${other}' status; git branch other/fix`)))).toBe("deny");
    for (const command of ["cd $TARGET && git branch developer/fix", "git branch $BRANCH", "echo `git branch claude/fix`", "git switch --create=claude/fix", "git checkout -B claude/fix", "g'it' branch claude/fix"]) expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, command)))).toBe("deny");
    expect(hook("guard-branch-prefix", cwd, bash(cwd, "printf '"))).toBeUndefined();
  });
});

describe("GitHub creation guard", () => {
  for (const mode of [undefined, "pr", "solo-shaped-kanban"]) {
    test(`${mode ?? "undeclared (pr)"}: repository asks, issues allowed, PR mode checked`, () => {
      const cwd = repo(mode);
      for (const command of ["gh repo create acme/widget", "gh --hostname github.com repo create widget"]) expect(decision(hook("guard-github-creation", cwd, bash(cwd, command)))).toBe("ask");
      expect(hook("guard-github-creation", cwd, bash(cwd, "gh issue create --title Example"))).toBeUndefined();
      expect(decision(hook("guard-github-creation", cwd, bash(cwd, "gh pr create --title Example")))).toBe(mode === "solo-shaped-kanban" ? "deny" : undefined);
      for (const [tool, expected] of [["mcp__github__create_repository", "ask"], ["mcp__github_enterprise__create_pull_request", mode === "solo-shaped-kanban" ? "deny" : undefined], ["mcp__github__create_issue", undefined]] as const) expect(decision(hook("guard-github-creation", cwd, { cwd, tool_name: tool, tool_input: { name: "widget" } }))).toBe(expected);
    });
    test(`${mode ?? "undeclared (pr)"}: repository opt-out skips only confirmation`, () => {
      const cwd = repo(mode), env = { AGENT_WORKFLOWS_ALLOW_REPO_CREATE: "1" };
      for (const command of ["gh repo create acme/widget", "gh --hostname github.com repo create widget", "gh api user/repos -X POST"]) {
        expect(hook("guard-github-creation", cwd, bash(cwd, command), env)).toBeUndefined();
      }
      expect(hook("guard-github-creation", cwd, { cwd, tool_name: "mcp__github__create_repository", tool_input: { name: "widget" } }, env)).toBeUndefined();
      expect(decision(hook("guard-github-creation", cwd, bash(cwd, "gh repo create acme/widget; gh pr create"), env))).toBe(mode === "solo-shaped-kanban" ? "deny" : undefined);
      writeFileSync(join(cwd, "git-workflow.json"), "{");
      expect(decision(hook("guard-github-creation", cwd, bash(cwd, "gh repo create acme/widget"), env))).toBe("deny");
    });
  }
  test("only the literal repository opt-out value 1 disables confirmation", () => {
    const cwd = repo("pr");
    for (const value of ["", "0", "true", "yes", " 1", "1 "]) {
      expect(decision(hook("guard-github-creation", cwd, bash(cwd, "gh repo create acme/widget"), { AGENT_WORKFLOWS_ALLOW_REPO_CREATE: value }))).toBe("ask");
    }
  });
  test("API create routes cannot bypass mode checks", () => {
    const cwd = repo("solo-shaped-kanban");
    for (const command of ["gh api repos/acme/widget/pulls -f title=Example", "gh api --method POST /repos/acme/widget/pulls", "gh api graphql -f 'query=mutation { createPullRequest(input: {}) { clientMutationId } }'", "gh api repos/acme/widget/pulls --input payload.json", "gh api repos/acme/widget/pulls -XGET; gh pr create"]) expect(decision(hook("guard-github-creation", cwd, bash(cwd, command)))).toBe("deny");
    expect(decision(hook("guard-github-creation", cwd, bash(cwd, "gh api user/repos -X POST")))).toBe("ask");
    for (const command of ["gh api repos/acme/widget/pulls -X GET", "gh pr view 1", "echo 'gh pr create'", "gh issue create"]) expect(hook("guard-github-creation", cwd, bash(cwd, command))).toBeUndefined();
  });
  test("single-quoted backticks in PR titles are literal, real substitution is denied as quoting", () => {
    const cwd = repo("pr");
    expect(hook("guard-github-creation", cwd, bash(cwd, "gh pr create -R acme/widget --base trunk --title 'Set `trunk` as the PR base branch' --body-file body.md"))).toBeUndefined();
    expect(hook("guard-github-creation", cwd, bash(cwd, "gh pr create --title 'Costs $5 for `x`'"))).toBeUndefined();
    for (const command of ['gh pr create --title "Set `trunk` as base"', "gh pr create --title Set\\ `trunk`", "gh pr create --title \"Set $(echo trunk) as base\"", "gh pr create --title $TITLE"]) {
      const output = hook("guard-github-creation", cwd, bash(cwd, command));
      expect(decision(output)).toBe("deny");
      expect(output.permissionDecisionReason).toContain("quot");
      expect(output.permissionDecisionReason).toContain("--title 'Set `name` as");
    }
  });
  test("a shell-expanded PR title outside pr mode reports the workflow requirement first", () => {
    const cwd = repo("solo-shaped-kanban");
    const output = hook("guard-github-creation", cwd, bash(cwd, 'gh pr create --title "Fix `x`"'));
    expect(decision(output)).toBe("deny");
    expect(output.permissionDecisionReason).toContain('requires {"workflow":"pr"}');
  });
  test("global flags between subcommands do not bypass creation checks", () => {
    const cwd = repo("solo-shaped-kanban");
    for (const command of ["gh pr --repo acme/widget create", "gh pr -Racme/widget create", "gh api -X POST repos/acme/widget/pulls", "gh api '/repos/acme/widget/pulls?example=1' -f title=Example"]) expect(decision(hook("guard-github-creation", cwd, bash(cwd, command)))).toBe("deny");
  });
});

describe("PR mutation guard", () => {
  test("land settings do not deny an otherwise allowed git push", () => {
    const cwd = repo("solo-shaped-kanban");
    writeFileSync(join(cwd, "git-workflow.json"), JSON.stringify({ workflow: "solo-shaped-kanban", baseBranch: "trunk", land: { quality: [["bun", "test"]], deploy: "push-triggered" } }));
    expect(hook("guard-pr-mutation", cwd, bash(cwd, "git push origin HEAD:trunk"))).toBeUndefined();
  });
  for (const mode of [undefined, "pr", "solo-shaped-kanban"]) {
    test(`${mode ?? "undeclared (pr)"}: merge override and base push`, () => {
      const cwd = repo(mode);
      expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, "gh pr merge 12 --admin")))).toBe("deny");
      for (const command of ["git push --force origin HEAD:trunk", "git push origin +HEAD:refs/heads/trunk", "git push --force-with-lease origin trunk", "git push --mirror origin"]) expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, command)))).toBe("deny");
      expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, "git push origin HEAD:trunk")))).toBe(mode === "solo-shaped-kanban" ? undefined : "deny");
      expect(hook("guard-pr-mutation", cwd, bash(cwd, "git push origin HEAD:developer/fix"))).toBeUndefined();
      expect(hook("guard-pr-mutation", cwd, bash(cwd, "gh pr merge 12 --squash"))).toBeUndefined();
    });
  }
  test("implicit and configured base refspec pushes cannot bypass", () => {
    const cwd = repo("pr");
    expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, "git push")))).toBe("deny");
    git(cwd, "config", "remote.origin.push", "HEAD:refs/heads/trunk");
    for (const command of ["git push origin", "git push origin --all", "git push origin :trunk", "git -c push.default=matching push origin", "git push --repo=origin HEAD:trunk"]) expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, command)))).toBe("deny");
    expect(hook("guard-pr-mutation", cwd, bash(cwd, "git push --dry-run origin trunk"))).toBeUndefined();
    expect(hook("guard-pr-mutation", cwd, bash(cwd, "git status"))).toBeUndefined();
  });
  test("push config and aggregate short options cannot hide a base update", () => {
    const cwd = repo("solo-shaped-kanban");
    for (const command of ["git push -vf origin trunk", "git push --force-if-includes origin HEAD:trunk", "git push origin +trunk", "git push origin refs/heads/trunk:refs/heads/trunk --force"]) expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, command)))).toBe("deny");
    const pr = repo("pr"); git(pr, "switch", "-c", "developer/fix"); git(pr, "config", "remote.origin.push", "HEAD:trunk");
    expect(decision(hook("guard-pr-mutation", pr, bash(pr, "git push origin")))).toBe("deny");
    expect(decision(hook("guard-pr-mutation", pr, { cwd: pr, tool_name: "mcp__github__merge_pull_request", tool_input: { admin_override: true } }))).toBe("deny");
  });
  test("matching and mirror defaults are blocked, tag-only pushes are allowed", () => {
    const cwd = repo("pr"); git(cwd, "switch", "-c", "developer/fix"); git(cwd, "config", "push.default", "matching");
    expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, "git push origin")))).toBe("deny");
    expect(hook("guard-pr-mutation", cwd, bash(cwd, "git push origin --tags"))).toBeUndefined();
    git(cwd, "config", "push.default", "current"); git(cwd, "config", "remote.origin.mirror", "true");
    expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, "git push origin")))).toBe("deny");
  });
  test("implicit pushes use the configured push remote", () => {
    const cwd = repo("pr"); git(cwd, "switch", "-c", "developer/fix");
    git(cwd, "config", "remote.publish.push", "HEAD:trunk");
    git(cwd, "config", "remote.pushDefault", "publish");
    expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, "git push")))).toBe("deny");
    git(cwd, "config", "--unset", "remote.pushDefault");
    git(cwd, "config", "branch.developer/fix.pushRemote", "publish");
    expect(decision(hook("guard-pr-mutation", cwd, bash(cwd, "git push")))).toBe("deny");
  });
});

describe("guard runtime", () => {
  for (const name of ["guard-branch-prefix", "guard-github-creation", "guard-pr-mutation"]) {
    test(`${name}: malformed, oversized, invalid root and unrelated input`, () => {
      const cwd = repo("pr");
      for (const input of ["{", "[]", '"text"', " ".repeat(1024 * 1024 + 1), { cwd, tool_name: "Bash", tool_input: {} }]) expect(decision(hook(name, cwd, input))).toBe("deny");
      const command = name === "guard-branch-prefix" ? "git branch developer/fix" : name === "guard-github-creation" ? "gh pr create" : "git push origin trunk";
      expect(decision(hook(name, cwd, bash("/missing-project-directory", command)))).toBe("deny");
      expect(decision(hook(name, cwd, bash(temp(), command)))).toBe("deny");
      expect(decision(hook(name, cwd, bash(cwd, command), { CLAUDE_PLUGIN_ROOT: "/missing-plugin-directory" }))).toBe("deny");
      expect(decision(hook(name, cwd, bash(cwd, command), { GIT_DIR: "/missing-git-directory" }))).toBe("deny");
      expect(hook(name, cwd, { tool_name: "Read", tool_input: { file_path: "example.txt" } })).toBeUndefined();
      expect(hook(name, cwd, { tool_name: "mcp__example__read", tool_input: {} })).toBeUndefined();
      expect(hook(name, cwd, bash("/missing-project-directory", "echo hello"))).toBeUndefined();
      writeFileSync(join(cwd, "git-workflow.json"), "{");
      expect(decision(hook(name, cwd, bash(cwd, command)))).toBe("deny");
    });
  }
  test("missing Bun fails closed", () => {
    const cwd = repo("pr");
    expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, "git branch developer/fix"), { PATH: "/usr/bin:/bin" }))).toBe("deny");
  });
  test("partial stdin is bounded", async () => {
    const cwd = repo("pr"), start = Date.now();
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn("/bin/bash", [join(plugin, "hooks/guard-branch-prefix.sh")], { cwd, env: { ...process.env, CLAUDE_PLUGIN_ROOT: plugin } });
      let output = ""; const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("unbounded input")); }, 4500);
      child.stdout.on("data", data => { output += data; }); child.stdin.on("error", () => {});
      child.on("close", () => { clearTimeout(timer); resolve(output); }); child.stdin.write('{"tool_name":');
    });
    expect(JSON.parse(result).hookSpecificOutput.permissionDecision).toBe("deny"); expect(Date.now() - start).toBeLessThan(4000);
  });
  test("isolated installation needs no sibling plugin", () => {
    const install = join(temp(), "plugin with spaces"); cpSync(plugin, install, { recursive: true });
    const cwd = repo("pr", "developer"); expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, "git branch claude/fix"), {}, install))).toBe("deny");
  });
  test("a missing or escaping classifier denies", () => {
    const install = join(temp(), "isolated"); cpSync(plugin, install, { recursive: true });
    const cwd = repo("pr"); rmSync(join(install, "hooks/guard-branch-prefix.ts"));
    expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, "git branch developer/fix"), {}, install))).toBe("deny");
    const outside = join(temp(), "policy.ts"); writeFileSync(outside, "process.exit(0)");
    require("node:fs").symlinkSync(outside, join(install, "hooks/guard-branch-prefix.ts"));
    expect(decision(hook("guard-branch-prefix", cwd, bash(cwd, "git branch developer/fix"), {}, install))).toBe("deny");
  });
  test("registrations resolve to executable files", () => {
    const config = JSON.parse(readFileSync(join(plugin, "hooks/hooks.json"), "utf8"));
    expect(Object.keys(config.hooks).sort()).toEqual(["PostToolUse", "PreToolUse", "SessionStart"]);
    let count = 0;
    for (const groups of Object.values(config.hooks) as any[]) for (const group of groups) for (const entry of group.hooks) {
      const match = /^"\$\{CLAUDE_PLUGIN_ROOT\}\/([^" ]+)"$/.exec(entry.command); expect(match).not.toBeNull();
      const path = join(plugin, match![1]!); expect(Bun.file(path).size).toBeGreaterThan(0);
      const { mode } = require("node:fs").statSync(path); expect(mode & 0o111).toBe(0o111); expect(entry.timeout).toBeGreaterThan(0); count++;
    }
    expect(count).toBe(6);
  });
});

describe("worktree advisories", () => {
  test("budget threshold, default, invalid override and disable", () => {
    const cwd = repo("pr"); git(cwd, "worktree", "add", "--detach", join(temp(), "linked"));
    const payload = { cwd };
    const output = hook("worktree-budget", cwd, payload, { GIT_FLOW_WORKTREE_BUDGET: "1" });
    expect(output.hookEventName).toBe("SessionStart"); expect(output.additionalContext).toContain("git worktree list"); expect(output.additionalContext).toContain("git worktree prune");
    for (const value of ["0", "2", "20", "invalid", "-1"]) expect(hook("worktree-budget", cwd, payload, { GIT_FLOW_WORKTREE_BUDGET: value })).toBeUndefined();
    // Registered paths need not still exist to consume the advisory budget.
    const common = git(cwd, "rev-parse", "--git-common-dir");
    for (let i = 0; i < 19; i++) { const path = join(cwd, common, "worktrees", `fixture-${i}`); mkdirSync(path, { recursive: true }); writeFileSync(join(path, "gitdir"), join(cwd, `missing-${i}`, ".git")); }
    expect(hook("worktree-budget", cwd, payload).additionalContext).toContain("21");
    expect(hook("worktree-budget", cwd, "{")).toBeUndefined();
  });
  test("repair only rebinds a declared existing hooks directory in a linked worktree", () => {
    const cwd = repo("pr"); mkdirSync(join(cwd, ".hooks")); writeFileSync(join(cwd, ".hooks/pre-commit"), "#!/bin/sh\nexit 0\n"); chmodSync(join(cwd, ".hooks/pre-commit"), 0o755);
    git(cwd, "add", ".hooks"); git(cwd, "-c", "user.name=Example Contributor", "-c", "user.email=dev@example.com", "commit", "-m", "Declare hooks");
    const linked = join(temp(), "linked"); git(cwd, "worktree", "add", "--detach", linked);
    git(cwd, "config", "core.hooksPath", join(cwd, ".hooks"));
    expect(hook("repair-worktree-hooks", linked, { cwd: linked })).toBeUndefined();
    expect(git(linked, "config", "core.hooksPath")).toBe(join(cwd, ".hooks"));
    git(cwd, "config", "extensions.worktreeConfig", "true");
    const output = hook("repair-worktree-hooks", linked, { cwd: linked }); expect(output.additionalContext).toContain("hooks");
    expect(git(linked, "config", "--worktree", "core.hooksPath")).toBe(".hooks");
    expect(git(cwd, "config", "--local", "core.hooksPath")).toBe(join(cwd, ".hooks"));
    expect(hook("repair-worktree-hooks", linked, { cwd: linked })).toBeUndefined();
    expect(hook("repair-worktree-hooks", cwd, { cwd })).toBeUndefined();
    git(linked, "config", "--worktree", "--unset", "core.hooksPath");
    const afterEnter = hook("repair-worktree-hooks", linked, { cwd: linked, hook_event_name: "PostToolUse", tool_name: "EnterWorktree" });
    expect(afterEnter.hookEventName).toBe("PostToolUse");
  });
  test("undeclared, external and relative setups are left alone", () => {
    const cwd = repo("pr"), linked = join(temp(), "linked"); git(cwd, "worktree", "add", "--detach", linked); git(cwd, "config", "extensions.worktreeConfig", "true");
    expect(hook("repair-worktree-hooks", linked, { cwd: linked })).toBeUndefined();
    for (const path of [".husky/_", join(temp(), "external")]) { git(cwd, "config", "core.hooksPath", path); expect(hook("repair-worktree-hooks", linked, { cwd: linked })).toBeUndefined(); expect(git(linked, "config", "core.hooksPath")).toBe(path); }
    expect(hook("repair-worktree-hooks", cwd, "{")).toBeUndefined();
  });
});
