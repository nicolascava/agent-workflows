---
schema_version: "1.0"
name: pr-non-closing-reference
description: Uses a visible non-closing issue reference
tags: [pr, deterministic]
plugins: ["../.."]
runs: 1
max_turns: 6
timeout_seconds: 180
allowed_tools: [Read, Glob, Grep, Skill]
---

Use /git-flow:pr to draft a PR for a login redirect fix. The repository uses pr mode. Link https://github.com/acme/widget/issues/123 without closing it. Include one Summary bullet and a visible Test plan checkbox. No commands. Do not invent completed test evidence.
