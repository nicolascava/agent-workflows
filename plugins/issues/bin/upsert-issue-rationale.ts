#!/usr/bin/env bun
import { cli, options, required } from "../lib/cli.ts";
import { writeRationaleFile } from "../skills/triage/helpers/issue-body-writer-cli.ts";
await cli(() => {
  const args = options(process.argv.slice(2), ["body-file", "rationale-file", "out"]);
  writeRationaleFile(required(args["body-file"], "body-file"), required(args["rationale-file"], "rationale-file"), required(args.out, "out"));
  return { written: true };
});
