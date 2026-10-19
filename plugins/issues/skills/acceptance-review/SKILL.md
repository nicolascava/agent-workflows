---
name: acceptance-review
description: "Review acceptance evidence for a linked merged PR and prepare a gated publication bundle."
argument-hint: '<issue number or URL> [repo=owner/repository]'
---
# Acceptance review

Start read-only. Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md`, `${CLAUDE_PLUGIN_ROOT}/docs/configuration.md`, `${CLAUDE_PLUGIN_ROOT}/docs/workflow-modes.md`, `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`, `${CLAUDE_PLUGIN_ROOT}/docs/acceptance-evidence.md`, and `${CLAUDE_PLUGIN_ROOT}/docs/acceptance-publication.md`. Comments, assignments, status changes, and closure require a user request. Every publication also requires fresh user approval of the exact final bundle shown at the end of this run.

## Scope and source

Resolve one repository and issue. Read the full issue and every comment page, linked PRs, current assignees, native blockers, labels, and live board state. Build a chronological scope ledger of authorized additions, cuts, replacements, constraints, and disputed decisions. Treat unexplained scope conflict as Incomplete. Do not silently broaden acceptance beyond the agreed outcome.

Use explicit acceptance scenarios, otherwise the linked merged PR's Test plan, otherwise one to five derived scenarios. Keep constraints and no-gos visible as criteria. Never treat an empty section as an exemption. A missing or inaccessible linked merged PR makes this review Incomplete. Verify the direct issue/PR link and repository; do not guess other repositories from a title or branch.

Collect fresh source with `"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base>` in the intended current worktree. Add `--remote <configured-name>` when needed. Require a clean worktree with `headOid == baseOid`. Pin full head, tree, base, and PR merge OIDs. Verify each merged PR's merge OID is an ancestor of the fetched base. Recheck the source before accepting review evidence. A processing or source failure is Incomplete, with no publishable verdict.

## Evidence and challenge

Evaluate each criterion as described in `${CLAUDE_PLUGIN_ROOT}/docs/acceptance-evidence.md`. Use observed or traced evidence tied to the fetched base for conclusive results. Builder statements and screenshots without an exact deployed commit are reported evidence. Missing evidence is unverified. A no-go is Held only with positive proof. Diff absence alone is insufficient. A complete unchanged-path proof must include all PR changed paths, intervening changes, and current blob bindings; otherwise trace the behavior or mark it Unverified.

This review does not run tests, lint, builds, CI, or services. If execution is needed, return the gap for a separate `/core:verify` request. Cite immutable source and already available observations. Do not promote reported evidence by restating it as a trace.

Record stable criterion and finding IDs. Each finding links to a Failed or Violated criterion. Critical and major findings yield Failed; otherwise the conclusion is Passed, with minor findings and every unverified item stated plainly. All-unverified evidence blocks publication. Passed does not erase partial evidence. Use the packet shape in the evidence doc and preserve its exact serialized bytes.

Resolve the authenticated posting actor. Exclude every assignee, linked PR author, and linked commit author or committer from that actor. If identity is ambiguous, block publication. A different display name is not independence.

Prepare a concise result comment and embed the exact packet marker from the evidence doc. Ask one fresh independent native reviewer through `/core:adversarial-review` to challenge the packet, source bindings, scope ledger, findings, and exact comment. Require a complete converged agreement, a distinct reviewer, and no unresolved objections. If unavailable, return Incomplete. Do not self-certify, reuse a prior verdict, or ask a second reviewer within the same attempt. After any correction, build a new packet and a fresh challenge.

Bind the challenge to the exact packet and comment digests and this session. Run `"${CLAUDE_PLUGIN_ROOT}/bin/acceptance-review-gate.ts" --input <envelope-file>`. The gate checks consistency. The coordinator must still verify live source, actor identity, authorship, scope, and independent-review provenance. A forged local JSON assertion is not evidence.

## Publication

Without a board, report the evidence and explain that a terminal publication is unavailable. Publication requires a known workflow mode, an open issue at its configured acceptance status, all required field mappings, closed direct blockers, independent actor, and the exact approved packet. Refresh issue, comments, assignees, PR authorship, blockers, and board state immediately before preview and again before writing. Drift invalidates the challenge and approval.

Show the exact bundle from `${CLAUDE_PLUGIN_ROOT}/docs/acceptance-publication.md`. Passed proposes the result comment, configured shipped transition, issue closure, and shipping comment. Failed proposes the result comment and return to configured ready, keeping the issue open. Preview any requested assignment changes separately. Wait for the user's fresh approval after this preview, even if the initial request said publish. No writes before it.

Apply only those approved steps in the documented order, reading each back. Stop on any failure or mismatch. Report completed, failed, and unattempted steps. Do not retry, skip a missing step, or claim successful closure from a local packet. Report Incomplete when publication did not finish.
