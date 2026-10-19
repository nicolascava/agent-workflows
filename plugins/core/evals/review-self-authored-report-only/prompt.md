---
schema_version: "1.0"
name: review-self-authored-report-only
description: Keeps a self-authored review report-only
tags: [review, deterministic]
plugins: ["../.."]
runs: 1
max_turns: 6
timeout_seconds: 180
allowed_tools: [Read, Glob, Grep, Skill]
---

Use /core:review to review PR 42. The authenticated actor and PR author are both developer. Report only. Do not post reviews, comments, approvals or change requests. Do not push changes or change the PR. Explain the boundary without running commands.
