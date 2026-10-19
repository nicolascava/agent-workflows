#!/usr/bin/env bun
import { cli, options } from "../lib/cli.ts";
import { json, runGh } from "../lib/gh.ts";
import { scanWaitingReplies } from "../lib/github-waiting-replies.ts";
await cli(async () => {
  const args = options(process.argv.slice(2), ["repo", "user"]);
  const repository = args.repo ?? json(await runGh(["repo", "view", "--json", "nameWithOwner"])).nameWithOwner;
  const user = args.user ?? json(await runGh(["api", "user"])).login;
  const result = await scanWaitingReplies({ repositories: repository.split(","), user }, runGh);
  if (!result.complete) process.exitCode = 1; return result;
});
