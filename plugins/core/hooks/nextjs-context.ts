#!/usr/bin/env bun
import { realpathSync } from "node:fs";
import { join } from "node:path";
import { containsPath, localFile, packageRoot, projectDirectory, readManifest, sessionContext } from "../lib/hook-runtime";
import { isRecord } from "../lib/is-record";

function hasNext(manifest: Record<string, unknown>): boolean {
  return [manifest.dependencies, manifest.devDependencies].some((list) => isRecord(list) && Object.hasOwn(list, "next") && typeof list.next === "string");
}

function repositoryHasNext(root: string): boolean {
  const manifest = readManifest(root);
  const workspaces = manifest.workspaces;
  const packages = isRecord(workspaces) ? workspaces.packages : workspaces;
  if (packages !== undefined && (!Array.isArray(packages) || packages.some((value) => typeof value !== "string"))) return false;
  if (workspaces !== undefined && packages === undefined) return false;
  const patterns = (packages ?? []) as string[];
  for (const pattern of patterns) {
    const path = pattern.replace(/^!/, "");
    if (!path || path.startsWith("/") || path.includes("\\") || path.split("/").some((part) => part === "." || part === ".." || !part)) return false;
  }
  const excluded = patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => new Bun.Glob(`${pattern.slice(1)}/package.json`));
  const manifests = [manifest];
  for (const pattern of patterns.filter((pattern) => !pattern.startsWith("!"))) {
    for (const path of new Bun.Glob(`${pattern}/package.json`).scanSync({ cwd: root, onlyFiles: true, followSymlinks: false })) {
      if (excluded.some((glob) => glob.match(path))) continue;
      const physical = realpathSync(join(root, path));
      if (!containsPath(root, physical)) return false;
      manifests.push(readManifest(join(root, path, "..")));
    }
  }
  return manifests.some(hasNext);
}

export function run(payload: Record<string, unknown>, root: string) {
  const project = packageRoot(projectDirectory(payload));
  if (!project || !repositoryHasNext(project)) return;
  const guidance = localFile(root, "docs/nextjs.md");
  sessionContext(`Read the Next.js guidance at ${guidance}. Read the repository's own Next.js docs if present.`);
}

if (import.meta.main) {
  const { runHook } = await import("./run-hook");
  await runHook("nextjs-context");
  process.exit(0);
}
