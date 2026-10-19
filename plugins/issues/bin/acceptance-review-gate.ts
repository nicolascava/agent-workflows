#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import { cli, options, input } from "../lib/cli.ts";
import { acceptanceReviewGate } from "../lib/acceptance-review-gate.ts";
await cli(() => {
  const args = options(process.argv.slice(2), ["input"]), envelope = input(args.input);
  return acceptanceReviewGate({ packetBytes: readFileSync(envelope.packetPath, "utf8"), comment: readFileSync(envelope.commentPath, "utf8"), challenge: input(envelope.challengePath) });
});
