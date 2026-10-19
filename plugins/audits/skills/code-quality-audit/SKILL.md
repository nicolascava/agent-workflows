---
name: code-quality-audit
description: Assess code quality using Git, source inspection, and existing repository check results. Use for a full snapshot or an explicitly pinned change comparison.
---

# Code quality audit

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

## Set the subject

Choose a full repository review or a change comparison from the user's request.
Bind the subject using `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`.
For a comparison, pin full base and head commit OIDs and state whether the range
is a direct comparison or a merge-base comparison. Verify both objects. Read
files from those commits, not from unrelated working files. For a current-worktree
review, record clean or dirty source identity as the source guide requires.

Discover owned source roots, generated and vendored exclusions, language tools,
manifests, scripts, lockfiles, CI definitions, and repository quality policies.
State the file counts and excluded areas. Do not assume package or application
locations. Use `git ls-files`, `git diff --no-ext-diff --no-textconv`, `rg`, and
`wc` as inspection tools. Treat counts and text matches as leads, not findings.

## Review quality

- Trace large functions, nested branches, duplicate logic, unclear ownership,
  and change hotspots to their callers and actual maintenance cost.
- Check type boundaries, unsafe casts, validation, error handling, resource
  cleanup, asynchronous control flow, and failure behavior.
- Compare tests to the important branches and invariants. Read existing coverage,
  lint, and test outputs with their revision, scope, command, and freshness.
- Inspect dead code, dependency boundaries, public interfaces, naming, and
  documentation against local conventions. Explain why a deviation matters.

Discover lint and test commands from repository scripts and CI. Do not run them
by default; they may write caches or artifacts. If the user separately requests
execution, show the commands and possible writes first and use the repository's
declared tooling. `/core:verify` is optional if installed and requested.
Unavailable tools or missing outputs reduce coverage. Never invent coverage,
duplication percentages, thresholds, quality gates, or a numeric health score.

## Report

Use the contract's report shape. State full-snapshot or comparison mode, pinned
OIDs, file scope, existing check results, and missing measurements. For comparisons,
separate introduced defects from pre-existing issues. Present evidenced findings
and a bounded repair order. Give a verification method for each proposed repair.
Do not publish a gate or change source and baselines.
