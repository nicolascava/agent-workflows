#!/usr/bin/env bun
import { cli, options, input } from "../lib/cli.ts";
import { shapedIssueGate } from "../lib/shaped-issue-gate.ts";
await cli(() => {
  const args = options(process.argv.slice(2), ["input"]), result = shapedIssueGate(input(args.input));
  if (!result.ready) process.exitCode = 1; return result;
});
