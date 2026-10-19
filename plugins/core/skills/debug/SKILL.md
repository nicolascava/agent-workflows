---
name: debug
description: "Find a bug's root cause through a four-phase investigation. Use before attempting any fix."
argument-hint: "<error description or failing command>"
---
# Systematic debugging workflow

Four-phase methodology. No fixes without root cause investigation first. Investigation is read-only. Write tests, logs, or fixes only when the task authorizes changes.

Read `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md` before code-dependent work. Use the intended current worktree only. Read `AGENTS.md`, `CLAUDE.md`, contribution guidance, and `git-workflow.json` only if present. Discover the package manager and required test, build, typecheck, and lint commands from package scripts, lockfiles, a Makefile, or CI configuration. Do not require a particular workflow mode.

Confirm the target repository, configured remote, and comparison branch. From that worktree, run `"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base>`; add `--remote <configured-name>` when needed. Require exit 0 and well-formed ready evidence. The live worktree, including uncommitted changes, is the subject. Use the freshly fetched full `baseOid` for comparisons. Block on missing or ambiguous evidence. Never substitute another checkout, a symbolic ref, or a cache. This is not clean default-branch evidence.

## Phase 1: Reproduce

- Capture the exact error message and stack trace.
- Run the failing command. Confirm the failure is consistent and reproducible.
- If the failure is intermittent, identify the conditions that trigger it.

## Phase 2: Investigate

- Read error messages carefully. The answer is often in the message.
- Trace the data flow from input to failure point.
- If recent repo changes are part of the investigation, compare the live subject with the helper's `baseOid`.
- If the bug appears only in uncommitted local edits, state that the debug pass reviews the live current worktree and inspect `git diff` plus `git diff --cached`.
- Gather evidence at component boundaries (API inputs/outputs, DB queries, env vars).
- **No fix attempts in this phase.** Only observation and evidence gathering.

## Phase 3: Hypothesize and test

- Form one hypothesis based on evidence from Phase 2.
- Design a minimal test to confirm or reject the hypothesis (add a log, inspect a value, write a focused test).
- If rejected, form the next hypothesis. One variable at a time.
- Document each hypothesis and its result so you don't repeat yourself.

## Phase 4: Fix (using `/core:tdd`)

1. Write a failing test that captures the bug (the "red" step of `/core:tdd`).
2. Implement the minimal fix. Change as little as possible.
3. Confirm the test passes (the "green" step).
4. Run the discovered build, typecheck, lint, and test commands. Report missing required checks as blocked or incomplete.
5. Run the proactive quality gate from `/core:tdd` on the fix diff. Resolve critical/major findings with concrete failure scenarios before declaring the bug fixed; report minor/nitpick follow-ups.

## Red flags (catch yourself)

- "I think I know what this is" without evidence. Go back to Phase 2.
- "Let me just try..." without a hypothesis. Go back to Phase 3.
- Applying a fix that worked for a different bug. Each bug needs its own investigation.
- Changing multiple things at once. One variable at a time.

## Escalation

- If 3+ fix attempts fail, stop. Question the architecture. The bug may be a symptom of a deeper design problem.
- If the investigation reveals the issue is outside this codebase (dependency, infrastructure, external service), document the finding and report to the user.
