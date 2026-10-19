---
schema_version: "1.0"
name: create-branch-rejects-agent-prefix
description: Rejects an agent branch prefix
tags: [create-branch, deterministic]
plugins: ["../.."]
runs: 1
max_turns: 6
timeout_seconds: 180
allowed_tools: [Read, Glob, Grep, Skill]
---

The repository declares `{"workflow":"pr","baseBranch":"trunk","branchPrefix":"developer"}`. I created claude/fix-login-redirect and want to push it. Use /git-flow:create-branch to explain whether that is acceptable and how to repair the branch name. Do not run commands.
