---
schema_version: "1.0"
name: pr-visible-description
description: Keeps the PR description visible
tags: [pr, deterministic]
plugins: ["../.."]
runs: 1
max_turns: 6
timeout_seconds: 180
allowed_tools: [Read, Glob, Grep, Skill]
---

Use /git-flow:pr to draft a PR in pr mode. Changes are in src/mail.ts and src/mail.test.ts. Retry handling is deferred. Give a plain imperative title, one to three Summary bullets, and a visible Test plan checkbox. Do not add hidden review contracts or claim tests ran. Do not run commands.
