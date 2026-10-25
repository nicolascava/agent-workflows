import { expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const root = import.meta.dir;
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

test("Grok skill has valid front matter and the namespaced entry point", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  const frontMatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  expect(frontMatter).not.toBeNull();
  const metadata = Bun.YAML.parse(frontMatter![1]) as Record<string, unknown>;
  expect(metadata.name).toBe("grok");
  expect(typeof metadata.description).toBe("string");
  expect((metadata.description as string).trim().length).toBeGreaterThan(0);
  expect(skill).toContain("/grok:grok");
});

test("installed paths stay in the plugin and exist", () => {
  let count = 0;
  for (const file of files(root).filter(path => path.endsWith(".md"))) {
    for (const [, path] of readFileSync(file, "utf8").matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s`"'<>()[\]{};,]+)/g)) {
      count++;
      const target = resolve(root, path);
      const local = relative(root, target);
      expect(isAbsolute(local) || local === ".." || local.startsWith(`..${sep}`), path).toBe(false);
      expect(existsSync(target), path).toBe(true);
    }
  }
  expect(count).toBeGreaterThan(0);
});

test("skill contains no approval bypass flags", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  for (const flag of ["--always-approve", "--yolo", "approval-mode yolo", "approval-mode=yolo", "auto_edit", "bypassPermissions", "acceptEdits", "dontAsk"]) {
    expect(skill).not.toContain(flag);
  }
});

test("skill runs Grok in plan mode with the prompt off argv", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  expect(skill).toContain("--permission-mode plan");
  expect(skill).toContain('--prompt-file "$SCRATCH/task.txt"');
  expect(skill).not.toContain('-p "$(cat');
});

test("skill checks exit status and preserves run and cleanup safeguards", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  for (const text of [
    "--no-auto-update", '--cwd "$SCRATCH/work"', "env -u XAI_API_KEY",
    `trap 'rm -rf -- "$SCRATCH"' EXIT`, "timeout",
    '[ "$STATUS" -eq 0 ] &&', 'mkdir "$SCRATCH/work" || exit 1',
  ]) {
    expect(skill).toContain(text);
  }
  expect(skill).toMatch(/^SCRATCH=\$\(mktemp -d .*\) \|\| exit 1$/m);
  expect(skill).not.toContain('cp "$SCRATCH/out.json" "$SCRATCH/answer.txt"');
});

test("scratch lifecycle stays in one Bash tool call", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  expect(skill).toContain("one Bash tool call");
  expect(skill).not.toContain("separate shell calls");
  expect(skill).toContain("The blocks run in Bash or zsh and require jq.");
  expect(skill).not.toContain("Require Bash");
  expect(skill).not.toContain("until the session exits");
});

test("prepare block resolves the CLI and sets the model", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  const prepare = skill.split("## Prepare the task")[1].split("## Run")[0]
    .match(/```bash\n([\s\S]*?)```/)?.[1];
  expect(prepare).toBeDefined();
  expect(prepare).toContain('GROK_BIN=$({ whence -p grok || type -P grok; } 2>/dev/null)');
  expect(prepare).toContain('[ -x "$GROK_BIN" ] && [ -f "$GROK_BIN" ] || {');
  expect(prepare).toContain("grok is not an executable file. See the setup guide.");
  expect(prepare).toContain("MODEL=''  # parsed --model value, or empty");
});

test("review block prints the answer and failure diagnostics before cleanup", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  const review = skill.split("## Review and report")[1]
    .match(/```bash\n([\s\S]*?)```/)?.[1];
  expect(review).toBeDefined();
  expect(review).toContain('cat "$SCRATCH/answer.txt"');
  expect(review).toContain('tail -n 20 "$SCRATCH/stderr.log"');
  expect(review).toContain(String.raw`printf 'exit status: %s\n' "$STATUS"`);
});

test("CLI and timeout paths must be absolute", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  expect(skill).toContain('case "$GROK_BIN" in /*) ;; *)');
  expect(skill).toContain('case "$TIMEOUT_BIN" in /*) ;; *)');
  expect(skill).toContain("grok path must be absolute. See the setup guide.");
  expect(skill).toContain("timeout path must be absolute.");
});

test("model ids are restricted before use in shell source", () => {
  const skill = readFileSync(resolve(root, "skills/grok/SKILL.md"), "utf8");
  expect(skill.split("## Set the scope")[1].split("## Resolve")[0])
    .toContain("^[A-Za-z0-9._:/-]+$");
  expect(skill).toContain(String.raw`case "$MODEL" in *[!A-Za-z0-9._:/-]*) printf '%s\n' 'Invalid model id.' >&2; exit 1 ;; esac`);
});

test("plugin markdown contains no em dash", () => {
  const markdown = files(root).filter(path => path.endsWith(".md"));
  expect(markdown.length).toBeGreaterThan(0);
  for (const path of markdown) {
    expect(readFileSync(path, "utf8"), path).not.toContain(String.fromCharCode(0x2014));
  }
});
