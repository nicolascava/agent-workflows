import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = import.meta.dir;
const repo = resolve(root, "../..");
const editing = ["Read", "Glob", "Grep", "Edit", "Write", "Bash"];
// Each ceiling is taken from that agent's source definition, including tool order.
const allowed: Record<string, string[]> = {
  "api-engineer": editing,
  "backend-engineer": editing,
  "code-reviewer": ["Read", "Glob", "Grep", "Bash"],
  "context-engineer": editing,
  "copy-editor": ["Read", "Bash"],
  dba: editing,
  "economy-researcher": ["Read", "Glob", "Grep"],
  "frontend-engineer": editing,
  "infrastructure-engineer": editing,
  "integration-and-rollout-reviewer": ["Read", "Glob", "Grep", "Bash", "WebFetch"],
  "model-policy-reviewer": ["Read", "Glob", "Grep", "WebFetch"],
  "product-prioritization-assistant": ["Read", "Glob", "Grep", "Bash", "WebFetch"],
  "repository-librarian": editing,
  "technical-writer": editing,
  "test-designer": ["Read", "Glob", "Grep", "Bash", "Edit", "Write"],
  triager: ["Read", "Glob", "Grep", "Bash", "WebFetch"],
  "ui-designer": ["Read", "Glob", "Grep", "Bash", "WebFetch"],
  "ux-designer": ["Read", "Glob", "Grep", "Bash", "WebFetch"],
};
const readOnly = new Set([
  "code-reviewer", "copy-editor", "economy-researcher", "integration-and-rollout-reviewer",
  "model-policy-reviewer", "product-prioritization-assistant", "triager", "ui-designer", "ux-designer",
]);
const agent = (name: string) => readFileSync(resolve(root, "agents", `${name}.md`), "utf8");

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

for (const [name, ceiling] of Object.entries(allowed)) {
  test(`${name} has valid metadata and stays within its source tools and task`, () => {
    const content = agent(name);
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    expect(match).not.toBeNull();
    const metadata = Bun.YAML.parse(match![1]) as Record<string, unknown>;
    expect(Object.keys(metadata).sort()).toEqual(["description", "name", "tools"]);
    expect(metadata.name).toBe(name);
    expect(typeof metadata.description).toBe("string");
    expect((metadata.description as string).trim().length).toBeGreaterThan(0);
    expect(typeof metadata.tools).toBe("string");
    const tools = (metadata.tools as string).split(",").map(tool => tool.trim());
    expect(tools.length).toBeGreaterThan(0);
    expect(new Set(tools).size).toBe(tools.length);
    for (const tool of tools) expect(ceiling, `${name}: ${tool}`).toContain(tool);
    const body = content.slice(match![0].length);
    expect(body).toContain("AGENTS.md");
    expect(body).toContain("CLAUDE.md");
    expect(body).toContain("if present");
    if (readOnly.has(name)) {
      for (const tool of ["Edit", "Write", "NotebookEdit"]) expect(tools).not.toContain(tool);
      expect(body).toMatch(/read-only/i);
      expect(body).toContain("Do not");
    } else {
      expect(tools).toContain("Edit");
      expect(tools).toContain("Write");
      expect(body).toContain("only within the task the caller assigns");
    }
  });
}

test("the agent roster is complete and contains no extra definitions", () => {
  expect(readdirSync(resolve(root, "agents")).sort()).toEqual(Object.keys(allowed).map(name => `${name}.md`).sort());
  const roster = readFileSync(resolve(root, "docs/README.md"), "utf8");
  const readme = readFileSync(resolve(repo, "README.md"), "utf8");
  for (const name of Object.keys(allowed)) {
    expect(roster).toContain(`../agents/${name}.md`);
    expect(readme).toContain(`\`${name}\``);
  }
});

test("shipped prose has no private identities, paths, servers, or persona introductions", () => {
  const forbidden = [
    ["docs", "os"].join("/"), ["packages", "scripts"].join("/"),
    ["apps", "web"].join("/"), ["packages", "ui"].join("/"),
    ["n", "ca"].join(""), ["n", "ca", "-run"].join(""),
    ["AGENT_RUNTIME", "LAUNCHER"].join("_"), ["action", "log"].join("-"),
    ["agent", "memory"].join(""), ["inter", "com"].join(""),
    ["g", "cloud"].join(""), ["computer", "use"].join("-"),
    ["client", "json"].join("."), ["p", "npm"].join(""),
    ["tur", "bo"].join(""), ["Dri", "zzle"].join(""), ["co", "ordinator"].join(""),
    ["assistant", "model", "policy.ts"].join("-"),
  ];
  for (const path of files(root).filter(path => path.endsWith(".md"))) {
    const content = readFileSync(path, "utf8");
    for (const token of forbidden) expect(content.toLowerCase(), path).not.toContain(token.toLowerCase());
    expect(content, path).not.toMatch(new RegExp("/(?:" + ["Users", "home"].join("|") + ")/[^/\\s]+"));
    expect(content, path).not.toMatch(/\b[A-Z0-9._%+-]+@(?!example\.(?:com|org|net)\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    // Sentence case prose needs no name pairs. A tool instruction is not a name.
    const namePairs = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) ?? [];
    expect(namePairs.filter(pair => pair !== "Use Bash"), path).toEqual([]);
    expect(content, path).not.toContain(String.fromCharCode(0x2014));
    expect(content, path).not.toMatch(/\/[^\s:]+\/SKILL\.md|\.claude\/skills\//);
  }
});

test("installed paths and optional namespaced skill references resolve", () => {
  let skillCount = 0;
  for (const file of files(root).filter(path => path.endsWith(".md"))) {
    const content = readFileSync(file, "utf8");
    for (const [, path] of content.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`"'<>()[\]{};,]+)/g)) {
      const target = resolve(root, path);
      const local = relative(root, target);
      expect(local === ".." || local.startsWith(`..${sep}`), path).toBe(false);
      expect(existsSync(target), path).toBe(true);
    }
    for (const line of content.split("\n")) {
      for (const [, plugin, skill] of line.matchAll(/\/([a-z][a-z0-9-]*):([a-z][a-z0-9-]*)\b/g)) {
        skillCount++;
        expect(existsSync(resolve(repo, "plugins", plugin, "skills", skill, "SKILL.md")), line).toBe(true);
        expect(line.toLowerCase()).toContain(`if the ${plugin} plugin is installed`);
      }
    }
  }
  expect(skillCount).toBeGreaterThan(0);
});

test("copy editing preserves evidence and returns a caller-owned JSON proposal", () => {
  const content = agent("copy-editor");
  for (const term of ["titleFile", "bodyFile", "evidenceFile", "originalBodyFile", "rewriteTitle", "rewriteBody", "summary", "BLOCKED", "72", "## Summary", "## Test plan", "## Plan output", "## Rollback", "byte-for-byte", "checkbox states", "review-scope/v1", "/git-flow:pr", "/git-flow:update-pr"])
    expect(content).toContain(term);
  expect(content).toContain("omit both rewrite keys");
  expect(content).toContain("Never invent");
  expect(content).toContain("mechanical");
});

test("bounded research and reviews cannot turn into implementation", () => {
  expect(agent("economy-researcher")).toContain("Stop at the requested file or result limit");
  expect(agent("economy-researcher")).toContain("hand back");
  expect(agent("code-reviewer")).toContain("file:line");
  expect(agent("code-reviewer")).toContain("failure scenario");
  expect(agent("integration-and-rollout-reviewer")).toContain("rollback");
  expect(agent("integration-and-rollout-reviewer")).toContain("idempotency");
  expect(agent("model-policy-reviewer")).toContain("official documentation");
  expect(agent("model-policy-reviewer")).toContain("account availability");
});

test("repository changes require an exact plan and protect unrelated work", () => {
  for (const name of ["context-engineer", "repository-librarian"]) {
    const content = agent(name);
    for (const term of ["approval", "unrelated", "generated", "secrets", "validation"]) expect(content).toContain(term);
  }
  expect(agent("repository-librarian")).toContain("git mv");
  expect(agent("repository-librarian")).toContain("Do not delete");
});

test("specialists discover the stack and keep design, testing, and triage boundaries", () => {
  expect(agent("dba")).toContain("ORM and database");
  expect(agent("dba")).toContain("destructive");
  expect(agent("frontend-engineer")).toContain("framework");
  expect(agent("ui-designer")).toContain("Discover UI source locations");
  expect(agent("ux-designer")).toContain("recovery");
  expect(agent("technical-writer")).toContain("Current/verified");
  expect(agent("test-designer")).toContain("red step");
  expect(agent("test-designer")).toContain("Do not edit production code");
  for (const name of ["triager", "product-prioritization-assistant"]) {
    expect(agent(name)).toContain("severity");
    expect(agent(name)).toContain("priority");
    expect(agent(name)).toContain("Do not invent");
  }
  expect(agent("triager")).toContain("gh");
  expect(agent("triager")).toContain("current repository");
  expect(agent("triager")).toContain("Output schema");
  expect(agent("triager")).toContain("/issues:triage");
});
