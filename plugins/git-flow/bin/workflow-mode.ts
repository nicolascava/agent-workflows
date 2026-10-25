#!/usr/bin/env bun
import { closeSync, constants, fstatSync, openSync, readSync, realpathSync } from "node:fs";
import { join } from "node:path";

const setup = 'Create git-workflow.json at the repository root with {"workflow":"pr"} or {"workflow":"solo-shaped-kanban"}.';
const env = { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_NO_REPLACE_OBJECTS: "1", GIT_OPTIONAL_LOCKS: "0" };
class CommandUnavailable extends Error {}
function command(args: string[]): string {
  let r;
  try { r = Bun.spawnSync(args, { env, timeout: 10_000 }); }
  catch { throw new CommandUnavailable(`${args[0]} command unavailable`); }
  if (r.exitCode !== 0) throw new Error(`cannot resolve ${args[0]} configuration`);
  return r.stdout.toString().trim();
}
const git = (...args: string[]) => command(["git", "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args]);
export type WorkflowDeclaration = {
  workflow: "pr" | "solo-shaped-kanban";
  baseBranch?: string;
  branchPrefix?: string;
  land?: { quality?: string[][]; deploy?: "nca-deploy-worker" | "push-triggered" };
};

// Hooks use declared values only. Identity and remote discovery stay in the CLI.
// Only an absent file defaults to pr; anything present must be valid.
export function readWorkflowDeclaration(root: string): WorkflowDeclaration {
  const path = join(root, "git-workflow.json");
  const irregular = "declaration must be a regular JSON file below 64 KiB";
  // One descriptor, opened without following links, so the checked file is the one read.
  let fd;
  try { fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK); } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { workflow: "pr" };
    if (code === "ELOOP" || code === "EMLINK") throw new Error(irregular);
    throw error;
  }
  const buffer = Buffer.alloc(65_537);
  let length;
  try {
    if (!fstatSync(fd).isFile()) throw new Error(irregular);
    length = readSync(fd, buffer, 0, buffer.length, 0);
  } finally { closeSync(fd); }
  if (length > 65_536) throw new Error(irregular);
  const config = JSON.parse(buffer.toString("utf8", 0, length));
  if (!config || typeof config !== "object" || Array.isArray(config) || Object.keys(config).some(k => !["workflow", "baseBranch", "branchPrefix", "land"].includes(k))) throw new Error("invalid declaration schema");
  if (!["pr", "solo-shaped-kanban"].includes(config.workflow)) throw new Error("unknown workflow");
  if (config.baseBranch !== undefined) {
    if (typeof config.baseBranch !== "string" || config.baseBranch === "HEAD" || config.baseBranch.startsWith("refs/")) throw new Error("baseBranch must be a branch name");
    git("check-ref-format", `refs/heads/${config.baseBranch}`);
  }
  if (config.branchPrefix !== undefined && (typeof config.branchPrefix !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(config.branchPrefix) || /^(?:claude|codex|gemini|agent|assistant)(?:-|$)|^worktree(?:-|$)/i.test(config.branchPrefix))) throw new Error("branchPrefix must identify a contributor, not an agent");
  if (config.land !== undefined) {
    const land = config.land;
    if (!land || typeof land !== "object" || Array.isArray(land) || Object.keys(land).some(k => !["quality", "deploy"].includes(k))) throw new Error("invalid land schema");
    if (land.quality !== undefined && (
      !Array.isArray(land.quality) || land.quality.length === 0 ||
      land.quality.some((argv: unknown) => !Array.isArray(argv) || argv.length === 0 || argv.some(arg => typeof arg !== "string" || arg.length === 0))
    )) throw new Error("land.quality must contain non-empty argument arrays of non-empty strings");
    if (land.deploy !== undefined && !["nca-deploy-worker", "push-triggered"].includes(land.deploy)) throw new Error("unknown land.deploy");
  }
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
  const top = git("rev-parse", "--show-toplevel");
  let root;
  try { root = realpathSync(top); } catch { throw new Error("cannot resolve repository root"); }
  let config;
  try { config = readWorkflowDeclaration(root); }
  catch (error) {
    if (error instanceof Error && !(error instanceof CommandUnavailable)) Object.assign(error, { declaration: true });
    throw error;
  }
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
    // Only a bad declaration is fixed by editing it; other failures get no setup hint.
    const hint = (error as { declaration?: boolean }).declaration ? ` ${setup}` : "";
    console.error(`workflow-mode: ${message}.${hint}`); process.exitCode = 1;
  }
}
