---
schema_version: "1.0"
name: create-branch-handle-prefix
description: Uses the declared contributor prefix
tags: [create-branch, deterministic]
plugins: ["../.."]
runs: 1
max_turns: 6
timeout_seconds: 180
allowed_tools: [Read, Glob, Grep, Skill]
---

The repository declares `{"workflow":"pr","baseBranch":"trunk","branchPrefix":"developer"}` in git-workflow.json. Use /git-flow:create-branch for a login redirect fix. Give the exact branch name and explain the naming rule. Do not run commands.
