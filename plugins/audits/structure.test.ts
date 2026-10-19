import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = import.meta.dir;
const names = [
  "code-quality-audit", "codebase-review", "debt-audit", "design-review",
  "documentation-review", "domain-audit", "figma-review", "frontend-review",
  "security-audit", "soc2-readiness-audit", "team-health-analysis",
];

test("audit skills have valid metadata, installed paths, and the shared contract", () => {
  const dirs = readdirSync(resolve(root, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  expect(dirs).toEqual(names);
  for (const name of dirs) {
    const skill = readFileSync(resolve(root, "skills", name, "SKILL.md"), "utf8");
    const frontMatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    expect(frontMatter, name).not.toBeNull();
    const metadata = Bun.YAML.parse(frontMatter![1]) as Record<string, unknown>;
    expect(metadata.name, name).toBe(name);
    expect(typeof metadata.description, name).toBe("string");
    expect((metadata.description as string).trim().length, name).toBeGreaterThan(0);
    expect(skill, name).toContain("${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md");
    const paths = [...skill.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`"'<>()[\]{};,]+)/g)];
    expect(paths.length, name).toBeGreaterThan(0);
    for (const [, path] of paths) {
      const target = resolve(root, path);
      const local = relative(root, target);
      expect(local === ".." || local.startsWith(`..${sep}`), `${name}: ${path}`).toBe(false);
      expect(existsSync(target), `${name}: ${path}`).toBe(true);
    }
  }
});
