#!/usr/bin/env bun
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

const setup = 'Create git-workflow.json at the repository root with {"workflow":"pr"} or {"workflow":"solo-shaped-kanban"}.';
const env = { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_NO_REPLACE_OBJECTS: "1", GIT_OPTIONAL_LOCKS: "0" };
function command(args: string[]): string {
  let r;
  try { r = Bun.spawnSync(args, { env, timeout: 10_000 }); }
  catch { throw new Error(`${args[0]} command unavailable`); }
  if (r.exitCode !== 0) throw new Error(`cannot resolve ${args[0]} configuration`);
  return r.stdout.toString().trim();
}
const git = (...args: string[]) => command(["git", "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args]);
export type WorkflowDeclaration = { workflow: "pr" | "solo-shaped-kanban"; baseBranch?: string; branchPrefix?: string };

// Hooks use declared values only. Identity and remote discovery stay in the CLI.
// Only an absent file defaults to pr; anything present must be valid.
export function readWorkflowDeclaration(root: string): WorkflowDeclaration {
  const path = join(root, "git-workflow.json");
  let stat;
  try { stat = lstatSync(path); } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { workflow: "pr" };
    throw error;
  }
  if (!stat.isFile() || stat.size > 65_536) throw new Error("declaration must be a regular JSON file below 64 KiB");
  const config = JSON.parse(readFileSync(path, "utf8"));
  if (!config || typeof config !== "object" || Array.isArray(config) || Object.keys(config).some(k => !["workflow", "baseBranch", "branchPrefix"].includes(k))) throw new Error("invalid declaration schema");
  if (!["pr", "solo-shaped-kanban"].includes(config.workflow)) throw new Error("unknown workflow");
  if (config.baseBranch !== undefined) {
    if (typeof config.baseBranch !== "string" || config.baseBranch === "HEAD" || config.baseBranch.startsWith("refs/")) throw new Error("baseBranch must be a branch name");
    git("check-ref-format", `refs/heads/${config.baseBranch}`);
  }
  if (config.branchPrefix !== undefined && (typeof config.branchPrefix !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.branchPrefix) || /^(?:claude|codex|gemini|agent|assistant)(?:-|$)|^worktree(?:-|$)/i.test(config.branchPrefix))) throw new Error("branchPrefix must identify a contributor, not an agent");
  return config as WorkflowDeclaration;
}

function main() {
  for (const key of Object.keys(process.env)) {
    if (/^GIT_(?:DIR|WORK_TREE|COMMON_DIR|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|NAMESPACE|SHALLOW_FILE|REPLACE_REF_BASE|CONFIG.*)$/.test(key)) throw new Error("repository-routing environment override is not allowed");
  }
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--remote" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(args[1]!))) throw new Error("usage: workflow-mode.ts [--remote <name>]");
  const remote = args[1] ?? "origin";
  if (git("rev-parse", "--is-inside-work-tree") !== "true") throw new Error("current directory must be a worktree");
  const root = realpathSync(git("rev-parse", "--show-toplevel"));
  const config = readWorkflowDeclaration(root);
  let baseBranch = config.baseBranch;
  if (baseBranch === undefined) {
    const urls = git("remote", "get-url", "--all", remote).split("\n");
    if (urls.length !== 1 || !urls[0]) throw new Error("remote must have one fetch URL");
    const result = git("ls-remote", "--symref", remote, "HEAD");
    const refs = [...result.matchAll(/^ref: refs\/heads\/([^\t\n]+)\tHEAD$/gm)];
    if (refs.length !== 1) throw new Error("remote default branch is unavailable");
    baseBranch = refs[0]![1];
  }
  if (typeof baseBranch !== "string" || baseBranch === "HEAD" || baseBranch.startsWith("refs/")) throw new Error("baseBranch must be a branch name");
  git("check-ref-format", `refs/heads/${baseBranch}`);
  let branchPrefix = config.branchPrefix;
  if (branchPrefix === undefined) {
    try { branchPrefix = command(["gh", "api", "user", "--jq", ".login"]).toLowerCase(); }
    catch { branchPrefix = git("config", "user.name").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  }
  if (typeof branchPrefix !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(branchPrefix) || /^(?:claude|codex|gemini|agent|assistant)(?:-|$)|^worktree(?:-|$)/i.test(branchPrefix)) throw new Error("branchPrefix must identify a contributor, not an agent");
  return { root, workflow: config.workflow, baseBranch, branchPrefix, remote };
}
if (import.meta.main) {
  try { console.log(JSON.stringify(main())); }
  catch (error) {
    // Avoid echoing remote diagnostics, source JSON or paths that may contain secrets.
    const message = !(error instanceof Error) || error instanceof SyntaxError ? "invalid declaration"
      : typeof (error as NodeJS.ErrnoException).code === "string" ? "cannot read declaration" : error.message;
    console.error(`workflow-mode: ${message}. ${setup}`); process.exitCode = 1;
  }
}
