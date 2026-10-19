#!/usr/bin/env bun
import { localFile, projectDirectory, sessionContext } from "../lib/hook-runtime";

export function run(payload: Record<string, unknown>, root: string) {
  projectDirectory(payload);
  sessionContext(`Read the repository's own docs before changing behavior. Check current primary documentation for libraries and tools. Follow ${localFile(root, "docs/documentation-currency.md")}.`);
}

if (import.meta.main) {
  const { runHook } = await import("./run-hook");
  await runHook("documentation-guidance");
  process.exit(0);
}
