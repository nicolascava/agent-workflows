import { expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

test("behavioral scenarios have prompts, graders and existing namespaced skills", () => {
  const plugins = resolve(import.meta.dir, "../..");
  const cases: string[] = [];
  for (const name of ["git-flow", "core"]) {
    const directory = join(plugins, name, "evals");
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry); if (!statSync(path).isDirectory()) continue;
      cases.push(`${name}/${entry}`);
      expect(existsSync(join(path, "prompt.md"))).toBe(true);
      const graders = readdirSync(join(path, "graders")).filter(n => n.endsWith(".md")); expect(graders.length).toBeGreaterThan(0);
      for (const file of ["prompt.md", ...graders.map(n => `graders/${n}`)]) {
        const text = readFileSync(join(path, file), "utf8");
        const refs = [...text.matchAll(/\/([a-z][a-z-]*):([a-z][a-z-]*)\b/g), ...text.matchAll(/input_match:\s*["']?([a-z][a-z-]*):([a-z][a-z-]*)\b/g)];
        for (const [, plugin, skill] of refs) expect(existsSync(join(plugins, plugin!, "skills", skill!, "SKILL.md"))).toBe(true);
      }
    }
  }
  expect(cases.sort()).toEqual(["core/review-self-authored-report-only", ...["create-branch-handle-prefix", "create-branch-rejects-agent-prefix", "merge-dirty-tree", "merge-no-admin-override", "pr-non-closing-reference", "pr-visible-description"].map(n => `git-flow/${n}`)].sort());
});
