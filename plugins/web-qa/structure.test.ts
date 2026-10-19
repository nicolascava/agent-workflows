import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = import.meta.dir;
const names = ["e2e-video", "interface-design", "visual-regression", "walkthrough-video", "webapp-testing"];

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
