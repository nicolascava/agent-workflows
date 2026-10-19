import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "../../..");
const script = join(import.meta.dir, "codex-wait.sh");

function wait(contents: string | null, options: { alive?: number; late?: boolean; args?: string[] } = {}) {
  const dir = mkdtempSync(join(root, ".codex-wait-test-"));
  const pidFile = join(dir, "run pid");
  const probes = join(dir, "probes");
  const sleeps = join(dir, "sleeps");
  const shellEnv = join(dir, "shell-env");
  try {
    if (contents !== null) writeFileSync(pidFile, contents);
    writeFileSync(probes, "");
    writeFileSync(sleeps, "");
    // Model process probes and time. Never signal a real process or actually sleep.
    writeFileSync(shellEnv, `
_probes=0
_sleeps=0
kill() {
  [ "$1" = -0 ] && [ "$2" = 424242 ] || return 1
  _probes=$((_probes + 1))
  printf '%s\\n' "$2" >> "$TEST_PROBES"
  [ "$_probes" -le "$TEST_ALIVE" ]
}
sleep() {
  _sleeps=$((_sleeps + 1))
  printf '%s\\n' "$1" >> "$TEST_SLEEPS"
  if [ "$TEST_LATE" = 1 ] && [ "$_sleeps" = 2 ]; then
    printf '424242\\n' > "$TEST_PID_FILE"
  fi
  return 0
}
`);
    const result = spawnSync("bash", [script, ...(options.args ?? [pidFile])], {
      encoding: "utf8", timeout: 2000,
      env: {
        ...process.env, BASH_ENV: shellEnv, TEST_PID_FILE: pidFile,
        TEST_PROBES: probes, TEST_SLEEPS: sleeps,
        TEST_ALIVE: String(options.alive ?? 0), TEST_LATE: options.late ? "1" : "0",
      },
    });
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.trim().split("\n")).toHaveLength(1);
    return {
      output: result.stdout.trim(),
      probes: readFileSync(probes, "utf8").trim().split("\n").filter(Boolean),
      sleeps: readFileSync(sleeps, "utf8").trim().split("\n").filter(Boolean),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test.each([[], ["one", "two"]].map(args => ({ args })))("wait reports usage for invalid arguments %j", ({ args }) => {
  expect(wait(null, { args }).output).toBe("CODEX_WAIT unknown: usage: codex-wait.sh <pid-file>");
});

test.each([null, "", "424242", "0\n", "1\n", "-1\n", "42x\n", " 424242\n", "999999999999999999999\n"])(
  "wait rejects missing, incomplete, or unsafe pid input %j", contents => {
    const result = wait(contents);
    expect(result.output).toStartWith("CODEX_WAIT unknown: no pid in ");
    expect(result.probes).toEqual([]);
    expect(result.sleeps).toEqual(Array(5).fill("2"));
  },
);

test("wait reports a finished process without sleeping", () => {
  const result = wait("424242\n");
  expect(result.output).toBe("CODEX_WAIT done");
  expect(result.probes).toEqual(["424242"]);
  expect(result.sleeps).toEqual([]);
});

test("wait tolerates a pid file whose line completes after launch", () => {
  const result = wait("424", { late: true, alive: 2 });
  expect(result.output).toBe("CODEX_WAIT done");
  expect(result.sleeps).toEqual(["2", "2", "10", "10"]);
});

test("wait bounds a running process to 54 ten-second polls", () => {
  const result = wait("424242\n", { alive: 1000 });
  expect(result.output).toBe("CODEX_WAIT running");
  expect(result.probes).toHaveLength(54);
  expect(result.sleeps).toEqual(Array(54).fill("10"));
});
