#!/usr/bin/env bun
import { accessSync, constants, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import { containsPath, packageRoot, projectDirectory, readManifest } from "../lib/hook-runtime";
import { runBounded } from "../lib/bounded-command";
import { isRecord } from "../lib/is-record";

function exists(root: string, name: string): boolean {
  try { return statSync(join(root, name)).isFile(); } catch { return false; }
}

function formatter(root: string, manifest: Record<string, unknown>): string[] | null {
  const scripts = isRecord(manifest.scripts) ? manifest.scripts : {};
  const script = ["format", "lint:fix"].find((name) => typeof scripts[name] === "string" && scripts[name].trim());
  if (script) {
    // Lockfiles select the repository's package manager. Never install a tool.
    const managers = [
      ["npm", ["package-lock.json", "npm-shrinkwrap.json"]],
      ["bun", ["bun.lock", "bun.lockb"]],
      ["yarn", ["yarn.lock"]],
      ["pnpm", ["pnpm-lock.yaml"]],
    ] as const;
    const found = managers.filter(([, locks]) => locks.some((lock) => exists(root, lock)));
    if (found.length === 1) return [found[0]![0], "run", script, ...(found[0]![0] === "npm" ? ["--"] : [])];
    // Ambiguous lockfiles cannot safely select a package manager.
    if (found.length > 1) return null;
  }
  const tools = [
    { name: "prettier", config: [".prettierrc", ".prettierrc.json", ".prettierrc.yml", ".prettierrc.yaml", ".prettierrc.js", ".prettierrc.cjs", ".prettierrc.mjs", ".prettierrc.toml", "prettier.config.js", "prettier.config.cjs", "prettier.config.mjs", "prettier.config.ts"], inline: "prettier", args: ["--write", "--"] },
    { name: "biome", config: ["biome.json", "biome.jsonc"], args: ["check", "--write", "--"] },
    { name: "eslint", config: ["eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", "eslint.config.ts", ".eslintrc", ".eslintrc.json", ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.yml", ".eslintrc.yaml"], inline: "eslintConfig", args: ["--fix", "--"] },
  ];
  for (const tool of tools) {
    if (!tool.config.some((name) => exists(root, name)) && !(tool.inline && Object.hasOwn(manifest, tool.inline))) continue;
    const binary = join(root, "node_modules/.bin", tool.name);
    try {
      if (!statSync(binary).isFile()) continue;
      accessSync(binary, constants.X_OK);
      return [binary, ...tool.args];
    } catch {}
  }
  return null;
}

export async function run(payload: Record<string, unknown>) {
  if (process.env.CORE_FORMAT_AFTER_EDIT !== "1") return;
  if (!isRecord(payload.tool_input) || typeof payload.tool_input.file_path !== "string" || !payload.tool_input.file_path) return;
  const cwd = projectDirectory(payload);
  const root = packageRoot(cwd);
  if (!root) return;
  const supplied = payload.tool_input.file_path;
  const file = realpathSync(isAbsolute(supplied) ? supplied : join(cwd, supplied));
  if (!containsPath(root, file) || !statSync(file).isFile()) return;
  if (relative(root, file).split(sep).some((part) => ["node_modules", ".git", ".claude", ".next", "dist", "build"].includes(part))) return;
  const command = formatter(root, readManifest(root));
  if (!command) return;
  await runBounded([...command, file], { cwd: root, timeout: 10000, capture: false });
}

if (import.meta.main) {
  const { runHook } = await import("./run-hook");
  await runHook("format-after-edit");
  process.exit(0);
}
