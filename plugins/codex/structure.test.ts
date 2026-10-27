import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = import.meta.dir;
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

test("Codex skill has valid front matter and the namespaced entry point", () => {
  const skill = readFileSync(resolve(root, "skills/codex/SKILL.md"), "utf8");
  const frontMatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  expect(frontMatter).not.toBeNull();
  const metadata = Bun.YAML.parse(frontMatter![1]) as Record<string, unknown>;
  expect(metadata.name).toBe("codex");
  expect(typeof metadata.description).toBe("string");
  expect((metadata.description as string).trim().length).toBeGreaterThan(0);
  expect(skill).toContain("/codex:codex");
});

test("Codex write modes map to the intended sandboxes", () => {
  const skill = readFileSync(resolve(root, "skills/codex/SKILL.md"), "utf8");
  expect(skill).toContain("`--write` selects `workspace-write`.");
  expect(skill).toContain("`--full-access` selects `danger-full-access`.");
  expect(skill).toContain("`SANDBOX=workspace-write` for `--write`");
  expect(skill).toContain("`SANDBOX=danger-full-access` for `--full-access`");
});

test("installed paths stay in the plugin and all cited scripts are executable Bash", () => {
  let count = 0;
  const cited = new Set<string>();
  for (const file of files(root).filter(path => path.endsWith(".md"))) {
    for (const [, path] of readFileSync(file, "utf8").matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`"'<>()[\]{};,]+)/g)) {
      count++;
      cited.add(path);
      const target = resolve(root, path);
      const local = relative(root, target);
      expect(local === ".." || local.startsWith(`..${sep}`), path).toBe(false);
      expect(existsSync(target), path).toBe(true);
      if (path.endsWith(".sh")) {
        expect(readFileSync(target, "utf8").startsWith("#!/usr/bin/env bash\n"), path).toBe(true);
        expect(statSync(target).mode & 0o777, path).toBe(0o755);
      }
    }
  }
  expect(count).toBeGreaterThan(0);
  for (const name of ["pace", "reap", "wait"]) expect(cited.has(`bin/codex-${name}.sh`)).toBe(true);
});

test("provider examples have no private paths, identities, servers, or launchers", () => {
  const examples = files(resolve(root, "examples/codex"));
  expect(examples.map(path => relative(resolve(root, "examples/codex"), path)).sort())
    .toEqual(["config.toml", "rules/git-safety.rules"]);
  const forbidden = [
    ["docs", "os"].join("/"), ["packages", "scripts"].join("/"),
    ["n", "ca"].join(""), ["n", "ca", "-run"].join(""),
    ["AGENT_RUNTIME", "LAUNCHER"].join("_"), ["agent", "memory"].join(""),
    ["apple", ""].join("-"), ["g", "cloud"].join(""), ["computer", "use"].join("-"),
  ];
  for (const path of examples) {
    const content = readFileSync(path, "utf8");
    expect(content, path).not.toMatch(new RegExp("/(?:" + ["Users", "home"].join("|") + ")/[^/\\s]+/"));
    expect(content, path).not.toMatch(/\b[A-Z0-9._%+-]+@(?!example\.(?:com|org|net)\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    for (const token of forbidden) expect(content.toLowerCase(), path).not.toContain(token.toLowerCase());
    expect(content, path).not.toContain(String.fromCharCode(0x2014));
  }
  const config = Bun.TOML.parse(readFileSync(resolve(root, "examples/codex/config.toml"), "utf8"));
  expect(config).toEqual({ sandbox_mode: "read-only", approval_policy: "never", forced_login_method: "chatgpt" });
});

test("Claude installation has no Codex provider hooks", () => {
  expect(JSON.parse(readFileSync(resolve(root, "hooks/hooks.json"), "utf8"))).toEqual({ hooks: {} });
});
