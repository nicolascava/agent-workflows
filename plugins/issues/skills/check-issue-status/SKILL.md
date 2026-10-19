---
name: check-issue-status
description: "Check issue outcomes against fresh immutable delivery-source evidence."
argument-hint: '<issue number or URL> [repo=owner/repository]'
---
# Check issue status

Default to a read-only report. Do not post, assign, close, or change status from a status-check request. Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md`, `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`, and `${CLAUDE_PLUGIN_ROOT}/docs/workflow-modes.md`.

Read the full issue, every comment page, its authorized scope changes, and linked PRs in the confirmed repository. Read legacy Solution as part of the contract. Resolve ambiguous scope explicitly. List each outcome, constraint, and no-go before judging code. Use explicit acceptance scenarios first, then the linked PR's Test plan, then derive one to five concrete scenarios from the issue. Never create an empty checklist to pass. Use N/A only with positive evidence that a criterion does not apply.

Confirm the intended current worktree, remote, and named delivery base from this repository. Run `"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base>` there, adding `--remote <configured-name>` when needed. Require exit 0 and ready evidence. For a Solved conclusion, require `dirty: false` and full `headOid == baseOid`. Record root, head, tree, and fetched base OIDs. No alternate checkout, cached source, moving symbolic ref, open PR head, or unfetched remote ref is delivery proof.

For every linked merged PR used as proof, verify its repository, merge OID, and ancestry of that OID in the fetched base with `git merge-base --is-ancestor <mergeOid> <baseOid>`. Read current source with immutable `<baseOid>:<path>` references. A merged PR alone does not prove the outcome still holds. Cite paths and lines at the full OID. Inspect relevant intervening changes. Missing, dirty, stale, or partial evidence makes dependent scenarios Incomplete.

Trace each scenario to the behavior that satisfies or violates it. Report scenario results as Passed, Failed, or Incomplete. Do not equate comments, unchecked plans, or absence of a diff with observed behavior. A no-go requires positive trace or observation. Distinguish observed, traced, reported, and unverified evidence as defined in `${CLAUDE_PLUGIN_ROOT}/docs/acceptance-evidence.md`.

Do not execute tests, builds, lint, or start services merely to inspect status. When the user also requests command verification, use `/core:verify` in the confirmed current worktree. Discover commands from repository guidance and configuration. Keep command failures and missing prerequisites visible. Command success alone does not satisfy unrelated outcomes.

Report Solved only if every required criterion and scenario has conclusive delivery evidence. Otherwise report Not solved with failed and incomplete criteria, precise gaps, and the next evidence needed. Keep the source OIDs with the report. Recheck source identity before finalizing.

If the user separately requests a comment, condense the exact draft through `/core:condense`, then challenge that exact packet with `/core:adversarial-review`. Any edit invalidates review. Show the final body before posting it, then read it back. Without complete independent approval, do not post. A close or terminal board transition belongs to `/issues:acceptance-review` and its separate publication approval.
