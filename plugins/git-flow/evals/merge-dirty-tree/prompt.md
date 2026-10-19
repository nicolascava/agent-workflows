---
schema_version: "1.0"
name: merge-dirty-tree
description: Stops a merge with unrelated local changes
tags: [merge, deterministic]
plugins: ["../.."]
runs: 1
max_turns: 6
timeout_seconds: 180
allowed_tools: [Read, Glob, Grep, Skill]
---

Use /git-flow:merge to merge PR 42. The repository uses pr mode with baseBranch trunk. Its status is:

```text
 M src/page.tsx
?? notes.txt
```

These are my unrelated changes. Explain the next step without running commands.
