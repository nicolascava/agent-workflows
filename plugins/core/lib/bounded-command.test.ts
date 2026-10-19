import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fixture, put } from "../hooks/test-support";
import { runBounded } from "./bounded-command";

test("bounded commands preserve argv and input and reject failed or oversized output", async () => {
  const result = await runBounded([process.execPath, "-e", 'console.log(JSON.stringify([process.argv[1], await Bun.stdin.text(), process.env.GIT_DIR]))', "a quoted argument"], { input: "payload", timeout: 1000 });
  expect(JSON.parse(result)).toEqual(["a quoted argument", "payload", null]);
  await expect(runBounded([process.execPath, "-e", "process.exit(1)"], { timeout: 1000 })).rejects.toThrow();
  await expect(runBounded([process.execPath, "-e", 'console.log("x".repeat(1024 * 1024 + 1))'], { timeout: 1000 })).rejects.toThrow();
});

test("a deadline kills commands that ignore termination and their children", async () => {
  const root = fixture(); const marker = join(root, "escaped"); const pidFile = join(root, "child-pid");
  const script = put(root, "command.ts", `
    process.on("SIGTERM", () => {});
    const child = Bun.spawn([process.execPath, "-e", 'await Bun.sleep(500); await Bun.write(process.argv[1], "escaped");', ${JSON.stringify(marker)}], {stdout:"ignore",stderr:"ignore"});
    await Bun.write(${JSON.stringify(pidFile)}, String(child.pid));
    await Bun.sleep(30000);
  `);
  try {
    const start = performance.now();
    await expect(runBounded([process.execPath, script], { timeout: 200 })).rejects.toThrow();
    expect(performance.now() - start).toBeLessThan(1500);
    await Bun.sleep(600);
    expect(existsSync(marker)).toBe(false);
  } finally {
    if (existsSync(pidFile)) { try { process.kill(Number(readFileSync(pidFile, "utf8")), "SIGKILL"); } catch {} }
  }
});

test("policy output preserves Unicode split between stream chunks and rejects invalid UTF-8", async () => {
  const script = 'const bytes=new TextEncoder().encode("💡"); process.stdout.write(bytes.slice(0,2)); await Bun.sleep(40); process.stdout.write(bytes.slice(2));';
  expect(await runBounded([process.execPath, "-e", script], { timeout: 1000 })).toBe("💡");
  await expect(runBounded([process.execPath, "-e", 'process.stdout.write(new Uint8Array([255]))'], { timeout: 1000 })).rejects.toThrow();
});
