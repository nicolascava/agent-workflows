// leak-scan-ignore-file: synthetic leak fixtures for scanner behavior tests.
import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const scanner = join(import.meta.dir, "leak-scan.ts");
const repositories: string[] = [];

afterEach(() => {
  for (const repo of repositories.splice(0)) {
    rmSync(repo, { recursive: true, force: true });
  }
});

function git(repo: string, ...args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd: repo });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
}

function repository(files: Record<string, string | Uint8Array> = {}) {
  const repo = mkdtempSync(join(root, ".git", "leak-scan-test-"));
  repositories.push(repo);
  git(repo, "init", "--quiet");
  for (const [name, content] of Object.entries(files)) {
    const path = join(repo, name);
    mkdirSync(resolve(path, ".."), { recursive: true });
    writeFileSync(path, content);
  }
  git(repo, "add", "--all");
  return repo;
}

function scan(repo: string, ...args: string[]) {
  const result = Bun.spawnSync([process.execPath, scanner, ...args], { cwd: repo });
  return {
    code: result.exitCode,
    out: result.stdout.toString(),
    err: result.stderr.toString(),
  };
}

test("an empty repository is clean", () => {
  expect(scan(repository())).toEqual({ code: 0, out: "", err: "" });
});

test("clean text and permitted email addresses pass", () => {
  const repo = repository({
    "clean.txt": [
      "A portable engineering workflow.",
      "dev@example.com dev@example.org dev@example.net",
      "DEV@EXAMPLE.COM noreply@invalid.test NOREPLY@invalid.test",
    ].join("\n"),
  });
  expect(scan(repo)).toEqual({ code: 0, out: "", err: "" });
});

const cases = [
  ["/Users/person/project/", "absolute-home-path"],
  ["/Users/test person/project/", "absolute-home-path"],
  ["/home/person/project/", "absolute-home-path"],
  ["C:\\Users\\person\\project", "absolute-home-path"],
  ["c:\\users\\person\\project", "absolute-home-path"],
  ["person@invalid.test", "email-address"],
  ["person+tag@invalid.test", "email-address"],
  ["person@sub.example.com", "email-address"],
  ["person@example.com.invalid.test", "email-address"],
  ["noreply-person@invalid.test", "email-address"],
  ["nca-run", "private-launcher"],
  ["docs/os/", "private-docs-path"],
  ["packages/scripts/", "private-scripts-path"],
  ["${CLAUDE_PROJECT_DIR}/packages", "private-project-packages"],
];

for (const [value, rule] of cases) {
  test(`reports ${rule}: ${value}`, () => {
    const repo = repository({ "nested/file with spaces.txt": `safe\n${value}\n` });
    expect(scan(repo)).toEqual({
      code: 1,
      out: `nested/file with spaces.txt:2: ${rule}\n`,
      err: "",
    });
  });
}

test("reports every matching rule and line without echoing source text", () => {
  const repo = repository({
    "sample.txt": "safe\r\nnca-run person@invalid.test\r\ndocs/os/\r\n",
  });
  const result = scan(repo);
  expect(result.code).toBe(1);
  expect(result.err).toBe("");
  expect(result.out.trim().split("\n").sort()).toEqual([
    "sample.txt:2: email-address",
    "sample.txt:2: private-launcher",
    "sample.txt:3: private-docs-path",
  ]);
});

test("does not scan untracked files", () => {
  const repo = repository({ "clean.txt": "safe" });
  writeFileSync(join(repo, "untracked.txt"), "person@invalid.test");
  expect(scan(repo)).toEqual({ code: 0, out: "", err: "" });
});

test("scans the current working copy of tracked files", () => {
  const repo = repository({ "sample.txt": "safe" });
  writeFileSync(join(repo, "sample.txt"), "nca-run");
  expect(scan(repo)).toEqual({
    code: 1, out: "sample.txt:1: private-launcher\n", err: "",
  });
});

test("skips binary files", () => {
  const repo = repository({
    "binary.dat": new Uint8Array([0, ...new TextEncoder().encode("nca-run")]),
    "invalid-utf8.dat": new Uint8Array([255, ...new TextEncoder().encode("nca-run")]),
  });
  expect(scan(repo)).toEqual({ code: 0, out: "", err: "" });
});

test("an inline marker skips only that fixture file", () => {
  const repo = repository({
    "fixture.ts": "// leak-scan-ignore-file: synthetic fixture\nnca-run\n",
    "real.txt": "nca-run",
  });
  expect(scan(repo)).toEqual({
    code: 1, out: "real.txt:1: private-launcher\n", err: "",
  });
});

test("--denylist reads regex rules and reports only their one-based indexes", () => {
  const repo = repository({ "sample.txt": "safe\ninternal-42\nHiddenName\n" });
  const denylist = join(repo, ".git", "private-denylist.txt");
  writeFileSync(denylist, "# private rules\n\ninternal-\\d+\n  # comment\nHiddenName\n");
  expect(scan(repo, "--denylist", denylist)).toEqual({
    code: 1,
    out: "sample.txt:2: denylist-rule-1\nsample.txt:3: denylist-rule-2\n",
    err: "",
  });
});

test("a non-matching denylist is clean", () => {
  const repo = repository({ "sample.txt": "safe" });
  const denylist = join(repo, ".git", "private-denylist.txt");
  writeFileSync(denylist, "# comment\nHiddenName\n");
  expect(scan(repo, "--denylist", denylist)).toEqual({ code: 0, out: "", err: "" });
});

test("invalid denylist regexes fail without disclosing their contents", () => {
  const repo = repository();
  const denylist = join(repo, ".git", "private-denylist.txt");
  writeFileSync(denylist, "HiddenName[\n");
  expect(scan(repo, "--denylist", denylist)).toEqual({
    code: 1, out: "", err: "leak-scan: invalid denylist rule 1\n",
  });
});

test("a missing denylist fails without disclosing its path", () => {
  const repo = repository();
  expect(scan(repo, "--denylist", "missing-private-file")).toEqual({
    code: 1, out: "", err: "leak-scan: cannot read denylist\n",
  });
});

for (const args of [["--denylist"], ["--unknown"], ["--denylist", "--unknown"]]) {
  test(`invalid arguments fail: ${args.join(" ")}`, () => {
    expect(scan(repository(), ...args)).toEqual({
      code: 1, out: "", err: "Usage: bun scripts/leak-scan.ts [--denylist <path>]\n",
    });
  });
}
