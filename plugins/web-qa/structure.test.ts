import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = import.meta.dir;
const names = ["e2e-video", "interface-design", "setup-ci", "visual-regression", "walkthrough-video", "webapp-testing"];

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

test("web QA skills have valid metadata and explicit video invocation", () => {
  const dirs = readdirSync(resolve(root, "skills"), { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  expect(dirs).toEqual(names);
  for (const name of dirs) {
    const skill = readFileSync(resolve(root, "skills", name, "SKILL.md"), "utf8");
    const frontMatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    expect(frontMatter, name).not.toBeNull();
    const metadata = Bun.YAML.parse(frontMatter![1]) as Record<string, unknown>;
    expect(metadata.name, name).toBe(name);
    expect(typeof metadata.description, name).toBe("string");
    expect((metadata.description as string).trim().length, name).toBeGreaterThan(0);
    if (["e2e-video", "walkthrough-video"].includes(name)) expect(metadata["disable-model-invocation"]).toBe(true);
  }
});

test("every installed asset path stays in this plugin and exists", () => {
  let count = 0;
  for (const file of files(root).filter(path => path.endsWith(".md"))) {
    const content = readFileSync(file, "utf8");
    for (const [, path] of content.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`"'<>()[\]{};,]+)/g)) {
      count++;
      const target = resolve(root, path);
      const local = relative(root, target);
      expect(local === ".." || local.startsWith(`..${sep}`), `${file}: ${path}`).toBe(false);
      expect(existsSync(target), `${file}: ${path}`).toBe(true);
    }
  }
  expect(count).toBeGreaterThan(0);
});

test("helper entry points have a Bun shebang and executable permissions", () => {
  for (const name of ["e2e-init", "e2e-video", "e2e-narrate"]) {
    const file = resolve(root, "bin", `${name}.ts`);
    expect(readFileSync(file, "utf8").startsWith("#!/usr/bin/env bun\n")).toBe(true);
    expect(statSync(file).mode & 0o777).toBe(0o755);
  }
});

const actionPins = new Map([
  ["actions/checkout", "34e114876b0b11c390a56381ad16ebd13914f8d5"],
  ["actions/setup-node", "49933ea5288caeca8642d1e84afbd3f7d6820020"],
  ["oven-sh/setup-bun", "4bc04d37a750122a420985ada21198f5743458b5"],
  ["actions/upload-artifact", "ea165f8d65b6e75b540449e92b4886f43607fa02"],
]);

test("CI templates parse, contain only public pins, and have no private paths or identities", () => {
  const templates = files(resolve(root, "templates"));
  expect(templates.length).toBeGreaterThan(0);
  let actions = 0;
  for (const file of templates) {
    const content = readFileSync(file, "utf8");
    expect(content, file).not.toMatch(/(?:\/Users\/|\/home\/)[^/\s]+\//);
    expect(content, file).not.toMatch(/\b[A-Z0-9._%+-]+@(?!example\.(?:com|org|net)\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    expect(content, file).not.toMatch(new RegExp(["docs", "os"].join("/") + "|" + ["packages", "scripts"].join("/")));
    expect(content, file).not.toContain(String.fromCharCode(0x2014));
    if (/\.ya?ml$/.test(file)) expect(Bun.YAML.parse(content), file).toBeTruthy();
    for (const [, reference] of content.matchAll(/uses:\s*([^\s]+)/g)) {
      actions++;
      const [action, pin] = reference.split("@");
      expect(actionPins.has(action), file).toBe(true);
      expect(pin, file).toBe(actionPins.get(action));
    }
    for (const [, image] of content.matchAll(/(?:image:\s*|\s)([^\s"']+@sha256:[a-f0-9]+)/g)) {
      expect(image, file).toMatch(/@sha256:[a-f0-9]{64}$/);
    }
  }
  expect(actions).toBeGreaterThan(0);
});

test("scanner manifest matches workflow images and records license provenance", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "templates/security-scanners.json"), "utf8"));
  const workflow = readFileSync(resolve(root, "templates/security-checks.yml"), "utf8");
  const notice = readFileSync(resolve(root, "templates/NOTICE.md"), "utf8");
  expect(Object.keys(manifest).sort()).toEqual(["gitleaks", "osv", "semgrep"]);
  for (const entry of Object.values(manifest) as { image: string; license: string; provenance: string }[]) {
    expect(workflow).toContain(entry.image);
    expect(notice).toContain(entry.license);
    expect(entry.provenance).toStartWith("https://");
  }
});
