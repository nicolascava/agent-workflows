import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, test } from "bun:test";

const ROOT = resolve(import.meta.dirname, "../../..");
const SCRIPTS = import.meta.dir;
const NOW = 1_800_000_000;
const WEEK = 10_080 * 60;

function weekly(used: number, elapsed = 50) {
  return {
    used_percent: used,
    window_minutes: 10_080,
    resets_at: NOW + WEEK * (1 - elapsed / 100),
  };
}

function runPace(
  limits?: unknown, olderLimits?: unknown,
  options: { stringPayload?: boolean; olderDay?: boolean } = {},
) {
  const dir = mkdtempSync(join(ROOT, ".codex-pace-test-"));
  const codexHome = join(dir, "codex home");
  const bin = join(dir, "bin");
  const sessions = join(codexHome, "sessions/2026/10/07");

  try {
    mkdirSync(bin, { recursive: true });
    mkdirSync(sessions, { recursive: true });
    writeFileSync(join(bin, "date"), `#!/bin/bash\nprintf '%s\\n' '${NOW}'\n`, { mode: 0o755 });

    if (limits !== undefined) {
      const lines = [
        "malformed line",
        ...(options.stringPayload ? [JSON.stringify({ payload: "invalid" })] : []),
        JSON.stringify({ payload: { rate_limits: limits } }),
        JSON.stringify({ payload: { rate_limits: null } }),
      ].join("\n");

      writeFileSync(join(sessions, "rollout-new.jsonl"), `${lines}\n`);
    }

    if (olderLimits !== undefined) {
      const olderSessions = options.olderDay ? join(codexHome, "sessions/2026/10/06") : sessions;

      mkdirSync(olderSessions, { recursive: true });

      const older = join(olderSessions, "rollout-old.jsonl");

      writeFileSync(older, `${JSON.stringify({ payload: { rate_limits: olderLimits } })}\n`);
      utimesSync(older, options.olderDay ? NOW : 1, options.olderDay ? NOW : 1);
      if (options.olderDay && limits !== undefined) {
        utimesSync(join(sessions, "rollout-new.jsonl"), 1, 1);
      }
    }

    const result = spawnSync("bash", [join(SCRIPTS, "codex-pace.sh")], {
      encoding: "utf8",
      env: { ...process.env, CODEX_HOME: codexHome, PATH: `${bin}:${process.env.PATH}` },
      input: "{}\n",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout.trim().split("\n")).toHaveLength(1);

    return result.stdout.trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("Codex weekly pace", () => {
  test.each([
    [61, "over"], [60, "ok"], [50, "ok"], [30, "ok"], [29, "under"],
  ])("classifies %s percent used at half of the week", (used, status) => {
    expect(runPace({ secondary: weekly(used) })).toStartWith(`CODEX_PACE ${status}: ${used}% used, 50%`);
  });

  test("current low usage early in the week is ok", () => {
    expect(runPace({ secondary: weekly(1, 4) })).toStartWith("CODEX_PACE ok: 1% used, 4%");
  });

  test("uses a weekly primary window", () => {
    expect(runPace({ primary: weekly(29), secondary: { window_minutes: 300 } })).toStartWith("CODEX_PACE under:");
  });

  test.each([
    { rate_limit_reached_type: "weekly" },
    { rate_limit_reached: true, secondary: weekly(1) },
  ])("reports a reached limit before interpreting weekly usage", limits => {
    expect(runPace(limits)).toStartWith("CODEX_PACE over: limit reached");
  });

  test.each([false, ""])("ignores a reached-limit type of %s", reachedType => {
    expect(runPace({ rate_limit_reached_type: reachedType, secondary: weekly(29) })).toStartWith("CODEX_PACE under:");
  });

  test("skips a string payload before a valid rate-limit record", () => {
    expect(runPace({ secondary: weekly(29) }, undefined, { stringPayload: true })).toStartWith("CODEX_PACE under:");
  });

  test.each([
    undefined, {}, { secondary: { window_minutes: 300 } },
    { secondary: { ...weekly(10), used_percent: "10" } },
    { secondary: { ...weekly(10), resets_at: null } },
  ])("reports unknown when weekly data is unavailable or invalid", limits => {
    expect(runPace(limits)).toStartWith("CODEX_PACE unknown:");
  });

  test("reports a reset window as ok", () => {
    expect(runPace({ secondary: { ...weekly(90), resets_at: NOW } })).toBe("CODEX_PACE ok: weekly window has reset");
  });

  test("uses the newest rollout with rate-limit data", () => {
    expect(runPace({ secondary: weekly(29) }, { secondary: weekly(90) })).toStartWith("CODEX_PACE under:");
    expect(runPace(null, { secondary: weekly(90) })).toStartWith("CODEX_PACE over:");
  });

  test("uses the newest day even when an older day's rollout was modified later", () => {
    expect(runPace({ secondary: weekly(29) }, { secondary: weekly(90) }, { olderDay: true })).toStartWith("CODEX_PACE under:");
  });
});
