#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { cli, options, required } from "../lib/cli.ts";
import { issueStructureGate } from "../skills/triage/helpers/issue-structure-gate.ts";
await cli(() => {
  const args = options(process.argv.slice(2), ["body-file", "mode"]), mode = args.mode ?? "draft";
  if (!["draft", "readback", "refined"].includes(mode)) throw new Error("Invalid mode");
  const result = issueStructureGate(readFileSync(required(args["body-file"], "body-file"), "utf8"), mode as "draft");
  if (result.status === "fail") process.exitCode = 1; return result;
});
