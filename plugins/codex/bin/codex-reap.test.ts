import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

const ROOT = resolve(import.meta.dirname, "../../..");
const SCRIPT = join(import.meta.dir, "codex-reap.sh");
const USAGE = "CODEX_REAP unknown: usage: codex-reap.sh <worktree-root> <start-epoch>";
const REAP_TIMEOUT_MS = 30_000;
const TEST_TIMEOUT_MS = 40_000;
let fixtureRoot: string;
let controlDir: string;
let worktree: string;
let start: string;
let fixtures: { child: ChildProcess; exited: Promise<void> }[];
let orphans: number[];

async function childFixture(cwd: string) {
  const child = spawn("sleep", ["60"], { cwd, detached: true, stdio: "ignore" });
  const exited = new Promise<void>((resolveExit, reject) => {
    child.once("exit", () => resolveExit());
    child.once("error", reject);
  });

  fixtures.push({ child, exited });
  expect(child.pid).toBeDefined();

  return child.pid!;
}

async function fixture(cwd: string, command = "exec sleep 60", args: string[] = [], env = process.env) {
  const pidfile = join(worktree, `fixture-${orphans.length}.pid`);
  const launch = "bash -c \"$2\" \"${@:3}\" </dev/null >/dev/null 2>&1 & printf \"%s\\n\" \"$!\" > \"$1\"";
  const result = spawnSync("bash", ["-c", launch, "orphan", pidfile, command, ...args], {
    cwd, encoding: "utf8", timeout: REAP_TIMEOUT_MS, env,
  });
  const pid = Number(readFileSync(pidfile, "utf8").trim());

  orphans.push(pid);
  expect(result.status).toBe(0);
  expect(pid).toBeGreaterThan(1);

  await waitUntil(() => spawnSync("ps", ["-p", String(pid), "-o", "ppid="], { encoding: "utf8" })
    .stdout.trim() === "1");

  return pid;
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);

    return true;
  } catch {
    return false;
  }
}

async function waitUntil(ready: () => boolean) {
  for (let attempt = 0; attempt < 40 && !ready(); attempt++) {
    await Bun.sleep(50);
  }

  expect(ready()).toBe(true);
}

function waitForExit(pid: number) {
  return waitUntil(() => !isAlive(pid));
}

function runReap(args = [worktree, start], dryRun = false, cwd = ROOT) {
  const result = spawnSync("bash", [SCRIPT, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, CODEX_REAP_DRY_RUN: dryRun ? "1" : "0" },
    timeout: REAP_TIMEOUT_MS,
  });

  expect(result.status).toBe(0);
  expect(result.stderr).toBe("");
  expect(result.stdout.trim().split("\n")).toHaveLength(1);

  return result.stdout.trim();
}

beforeEach(() => {
  fixtureRoot = realpathSync(mkdtempSync(join(ROOT, ".codex-reap-test-")));
  worktree = join(fixtureRoot, "worktree");
  controlDir = join(fixtureRoot, "control");
  mkdirSync(worktree);
  mkdirSync(controlDir);
  start = String(Math.floor(Date.now() / 1000) - 1);
  fixtures = [];
  orphans = [];
});

afterEach(async () => {
  for (const pid of orphans) {
    if (isAlive(pid)) {process.kill(pid, "SIGKILL");}
  }

  for (const { child } of fixtures) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill("SIGKILL");
    }
  }

  try {
    await Promise.all([...orphans.map(waitForExit), ...fixtures.map(({ exited }) => exited)]);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test("reports macOS-only before inspecting processes on other platforms", () => {
  writeFileSync(join(worktree, "uname"), "#!/bin/sh\nprintf \"Linux\\n\"\n", { mode: 0o755 });
  const result = spawnSync("bash", [SCRIPT, worktree, start], {
    encoding: "utf8", env: { ...process.env, PATH: `${worktree}:${process.env.PATH}` }, timeout: REAP_TIMEOUT_MS,
  });

  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe("CODEX_REAP unknown: macOS only");
}, TEST_TIMEOUT_MS);

describe.skipIf(process.platform !== "darwin")("Codex post-run reaper", () => {
  test("reaps an orphaned cwd fixture and preserves an orphaned unrelated control", async () => {
    const pid = await fixture(worktree);
    const control = await fixture(controlDir);
    const output = runReap();

    await waitForExit(pid);

    expect(() => process.kill(pid, 0)).toThrow();
    expect(output).toStartWith(`CODEX_REAP killed=1: ${pid} `);
    expect(output).not.toContain(String(control));
    expect(() => process.kill(control, 0)).not.toThrow();
  }, TEST_TIMEOUT_MS);

  test("preserves a non-orphaned in-worktree child of the calling session", async () => {
    const pid = await childFixture(worktree);

    expect(runReap()).toBe("CODEX_REAP killed=0");
    expect(() => process.kill(pid, 0)).not.toThrow();
  }, TEST_TIMEOUT_MS);

  test.each([false, true])("preserves a worktree child of an external parent (older=%s)", async older => {
    const gate = join(worktree, "parent-gate");
    const pidfile = join(worktree, "parent-child.pid");

    expect(spawnSync("mkfifo", [gate]).status).toBe(0);

    const command = "read -r signal < \"$GATE\"; (cd -- \"$CHILD_CWD\"; exec sleep 60) & printf \"%s\\n\" \"$!\" > \"$PIDFILE\"; wait";
    const parent = await fixture(controlDir, command, [], {
      ...process.env, GATE: gate, PIDFILE: pidfile, CHILD_CWD: worktree,
    });

    if (older) {
      const second = Math.floor(Date.now() / 1000);

      await waitUntil(() => Math.floor(Date.now() / 1000) > second);

      start = String(Math.floor(Date.now() / 1000));
    }

    writeFileSync(gate, "go\n");

    await waitUntil(() => existsSync(pidfile));

    const pid = Number(readFileSync(pidfile, "utf8").trim());

    orphans.push(pid);
    expect(pid).toBeGreaterThan(1);
    expect(spawnSync("ps", ["-p", String(pid), "-o", "ppid="], { encoding: "utf8" }).stdout.trim())
      .toBe(String(parent));
    expect(runReap()).toBe("CODEX_REAP killed=0");
    expect(() => process.kill(parent, 0)).not.toThrow();
    expect(() => process.kill(pid, 0)).not.toThrow();
  }, TEST_TIMEOUT_MS);

  test.each([false, true])("matches worktree argv with cwd elsewhere (alias=%s)", async useAlias => {
    const alias = join(dirname(worktree), `alias-${basename(worktree)}`);
    const path = useAlias ? alias : worktree;

    if (useAlias) {symlinkSync(worktree, alias);}

    try {
      const pid = await fixture(controlDir, "exec -a \"$0\" sleep 60", [path]);

      expect(runReap([useAlias ? `${alias}/` : worktree, start], true)).toStartWith(`CODEX_REAP dry-run=1: ${pid} `);
      expect(() => process.kill(pid, 0)).not.toThrow();
    } finally {
      if (useAlias) {rmSync(alias);}
    }
  }, TEST_TIMEOUT_MS);

  test("resolves a relative worktree before matching argv", async () => {
    const pid = await fixture(controlDir, "exec -a unrelated.preview sleep 60");

    expect(runReap([".", start], true, worktree)).toBe("CODEX_REAP dry-run=0");
    expect(() => process.kill(pid, 0)).not.toThrow();
  }, TEST_TIMEOUT_MS);

  test("does not match a sibling worktree path in argv", async () => {
    const pid = await fixture(controlDir, "exec -a \"$0\" sleep 60", [`${worktree}-2/x`]);

    expect(runReap(undefined, true)).toBe("CODEX_REAP dry-run=0");
    expect(() => process.kill(pid, 0)).not.toThrow();
  }, TEST_TIMEOUT_MS);

  test("reaps an orphaned worktree parent and its worktree child", async () => {
    // Keep the parent alive if the reaper signals its child first.
    const parent = await fixture(worktree, "sleep 60 & while :; do wait; done");
    let pid = 0;

    await waitUntil(() => {
      pid = Number(spawnSync("pgrep", ["-P", String(parent)], { encoding: "utf8" }).stdout.trim());

      return pid > 1;
    });

    orphans.push(pid);
    const output = runReap();

    expect(output).toStartWith("CODEX_REAP killed=2: ");
    expect(output).toContain(`${parent} `);
    expect(output).toContain(`${pid} `);

    await Promise.all([waitForExit(parent), waitForExit(pid)]);
  }, TEST_TIMEOUT_MS);

  test("dry-run lists a fixture without killing it", async () => {
    const pid = await fixture(worktree);

    expect(runReap(undefined, true)).toStartWith(`CODEX_REAP dry-run=1: ${pid} `);
    expect(() => process.kill(pid, 0)).not.toThrow();
  }, TEST_TIMEOUT_MS);

  test("does not reap a process older than the cutoff", async () => {
    const pid = await fixture(worktree);

    expect(runReap([worktree, String(Math.floor(Date.now() / 1000) + 3600)])).toBe("CODEX_REAP killed=0");
    expect(() => process.kill(pid, 0)).not.toThrow();
  }, TEST_TIMEOUT_MS);

  test("protects the caller and the reaper's own processes in the worktree", () => {
    const args = ["-c", "bash \"$1\" \"$PWD\" \"$2\"; printf \"CALLER_ALIVE\\n\"", "caller", SCRIPT, start];
    const result = spawnSync("bash", args, {
      cwd: worktree,
      encoding: "utf8",
      env: { ...process.env, CODEX_REAP_DRY_RUN: "1" },
      timeout: REAP_TIMEOUT_MS,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toBe("CODEX_REAP dry-run=0\nCALLER_ALIVE\n");
  }, TEST_TIMEOUT_MS);

  test("escalates when a fixture ignores SIGTERM", async () => {
    const pid = await fixture(worktree, "trap \"\" TERM; exec sleep 60");

    expect(runReap()).toStartWith(`CODEX_REAP killed=1: ${pid} `);

    await waitForExit(pid);

    expect(() => process.kill(pid, 0)).toThrow();
  }, TEST_TIMEOUT_MS);

  test.each([
    [], ["/"], ["/", "invalid"], ["/", "-1"], ["/", "1", "extra"], ["/missing-codex-worktree", "1"],
  ].map(args => ({ args })))(
    "reports usage for invalid arguments %j", ({ args }) => {
      expect(runReap(args)).toBe(USAGE);
    },
  );
});
