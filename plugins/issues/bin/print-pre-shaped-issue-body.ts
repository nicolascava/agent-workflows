#!/usr/bin/env bun
import { cli, options, input } from "../lib/cli.ts";
import { buildPreShapedIssueBody } from "../skills/create-issue/helpers/print-pre-shaped-issue-body.ts";
await cli(() => { const args = options(process.argv.slice(2), ["input"]); return { body: buildPreShapedIssueBody(input(args.input)) }; });
