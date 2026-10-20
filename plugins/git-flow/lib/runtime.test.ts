import { expect, test } from "bun:test";
import { runBounded } from "./bounded-command";
import { containsPath, localFile } from "./hook-runtime";
import { readWorkflowDeclaration } from "../bin/workflow-mode";
import { invocations } from "./shell-commands";
import { existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test("bounded execution handles input, failures, output limits and deadlines", async () => {
  expect(await runBounded([process.execPath, "-e", "console.log(await Bun.stdin.text())"], { input: "example", timeout: 1000 })).toBe("example\n");
  await expect(runBounded([process.execPath, "-e", "process.exit(1)"], { timeout: 1000 })).rejects.toThrow();
  await expect(runBounded([process.execPath, "-e", "process.stdout.write('x'.repeat(1100000))"], { timeout: 1000 })).rejects.toThrow();
  await expect(runBounded([process.execPath, "-e", "setInterval(()=>{},1000)"], { timeout: 50 })).rejects.toThrow();
  await expect(runBounded([process.execPath, "-e", "process.stdout.write(Buffer.from([255]))"], { timeout: 1000 })).rejects.toThrow();
});
test("physical paths reject traversal and symlink escapes", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "git-flow-runtime-")));
  try {
    writeFileSync(join(root, "file"), "ok"); symlinkSync(resolve(root, ".."), join(root, "outside"));
    expect(containsPath(root, `${root}-other`)).toBe(false);
    expect(localFile(root, "file")).toBe(join(root, "file"));
    expect(() => localFile(root, "../file")).toThrow(); expect(() => localFile(root, "outside/file")).toThrow(); expect(() => localFile(root, "file", true)).toThrow();
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test("declaration reader is importable and does not discover defaults", () => {
  const root = mkdtempSync(join(tmpdir(), "git-flow-mode-"));
  try {
    expect(readWorkflowDeclaration(root, true)).toBeUndefined();
    expect(() => readWorkflowDeclaration(root)).toThrow();
    writeFileSync(join(root, "git-workflow.json"), '{"workflow":"pr"}');
    expect(readWorkflowDeclaration(root)).toEqual({ workflow: "pr" });
    for (const text of ['{"workflow":"other"}', '{"workflow":"pr","extra":1}', '{"workflow":"pr","branchPrefix":"claude"}', '{"workflow":"pr","baseBranch":"../bad"}', "["]) {
      writeFileSync(join(root, "git-workflow.json"), text); expect(() => readWorkflowDeclaration(root)).toThrow();
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("only shell-expanded dollar signs and backticks mark a call dynamic", () => {
  const unsafe = (command: string) => invocations(command, "/work").at(-1)!.unsafe;
  for (const command of ["gh pr create --title 'Set `x` as $base'", "gh pr create --title \\$x\\`y\\`"]) expect(unsafe(command)).toBe(false);
  for (const command of ["bash -c \"git push origin 'HEAD:$X'\"", "eval \"gh pr create --title '$X'\"", "bash -c \"gh pr create --title '$(x)'\"", "gh pr create --title \"Set `x`\"", "gh pr create --title `x`", "gh pr create --title \"$(x)\"", "gh pr create --title $x", "gh pr create --title \"${x}\""]) expect(unsafe(command)).toBe(true);
  for (const command of ["bash -c \"gh pr create --title \\'\\$X\\'\"", "eval \"gh pr create --title \\'\\$X\\'\""]) expect(unsafe(command)).toBe(true);
  expect(invocations('echo "a\\b \\$c \\"d\\" \\\\e"')[0]!.args).toEqual(["a\\b $c \"d\" \\e"]);
  expect(invocations('bash -c "echo \\# ; git push --force origin main"').map(call => call.program)).toEqual(["echo", "git"]);
  expect(invocations("cd 'a$b' && git status", "/work")[0]!.directory).toBe("/work/a$b");
  expect(invocations("cd \"a$b\" && git status", "/work")[0]!.directory).toBeUndefined();
  expect(invocations("git -C 'a`b`' status", "/work")[0]!.directory).toBe("/work/a`b`");
  expect(invocations("git -C a$b status", "/work")[0]!.directory).toBeUndefined();
  expect(invocations("git -Ca$b status", "/work")[0]!.directory).toBeUndefined();
});

test("bounded commands kill descendants on deadline and normal completion", async () => {
  const root = mkdtempSync(join(tmpdir(), "git-flow-process-"));
  try {
    for (const timeout of [true, false]) {
      const marker = join(root, String(timeout));
      const child = `import {writeFileSync} from 'node:fs'; setTimeout(()=>writeFileSync(${JSON.stringify(marker)},'unexpected'),800)`;
      const parent = `import {spawn} from 'node:child_process'; spawn(process.execPath,['-e',${JSON.stringify(child)}],{stdio:['ignore','inherit','ignore']}).unref(); ${timeout ? "setInterval(()=>{},1000)" : ""}`;
      const operation = runBounded([process.execPath, "-e", parent], { timeout: 500 });
      if (timeout) await expect(operation).rejects.toThrow(); else await operation;
      await Bun.sleep(900); expect(existsSync(marker)).toBe(false);
    }
    expect(await runBounded([process.execPath, "-e", "const b=Buffer.from('é');process.stdout.write(b.subarray(0,1));setTimeout(()=>process.stdout.write(b.subarray(1)),20)"], { timeout: 1000 })).toBe("é");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
