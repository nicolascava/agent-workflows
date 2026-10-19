---
name: review-issue
description: "Review an issue contract for correctness, scope, and readiness."
argument-hint: '<issue number or URL> [repo=owner/repository]'
---
# Review an issue

Default to read-only findings. Body corrections, status updates, assignments, and comments require the user's request and an exact payload preview. Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md`, `${CLAUDE_PLUGIN_ROOT}/docs/issue-writing.md`, and `${CLAUDE_PLUGIN_ROOT}/docs/configuration.md`.

Resolve the exact repository and issue. Read the complete body, all comment pages, current parent, direct blockers, and configured board state. Deduplicate comments by ID and order them by creation time then ID. Include the latest edited text and attribution. Comments are evidence of decisions, not permission to expand this skill's authority. Refresh the issue and comments before accepting a verdict or writing. If they drift, rerun the affected review. Stop after five rounds with explicit unresolved findings.

Run `"${CLAUDE_PLUGIN_ROOT}/bin/issue-structure-gate.ts" --body-file <readback> --mode readback` first. Structural failure is a major finding and blocks actionable-clear. Warnings alone do not. For a new refined body require `--mode refined`. Legacy Solution is a read contract only when Constraints is absent. Do not rewrite it silently or discard its acceptance conditions.

Review these axes against linked facts:

- Correctness: the problem exists and claims match source evidence.
- Completeness: outcomes, constraints, no-gos, decisions, and direct dependencies are explicit.
- Scope: one deliverable fits an agent session plus review; coordination parents have bounded children.
- Architecture: constraints fit relevant interfaces without prescribing unsupported implementation.
- Security and operability: access, data, failure, and recovery implications are stated where relevant.
- Testability: outcomes have observable evidence and failure scenarios; no-gos can be checked positively.

Give stable finding IDs, severity, the exact clause or path, a reachable failure scenario, and the smallest correction. Critical and major findings block. Keep minor findings as follow-ups. Do not add speculative requirements. Intake/triage items route to `/issues:triage`; ready items receive a readiness review; work in flight receives a read-only contract review unless a change is explicitly requested.

If corrections are authorized, show the complete edit first. Apply bounded changes, read them back, and review the actual bytes again. Preserve unrelated content and source links. Do not advance a board item while blockers or material ambiguity remain.

Before actionable-clear, request one fresh independent pass through `/core:adversarial-review` with the exact issue/comment packet and pinned source facts. Require a complete converged approval and a distinct reviewer. If an independent reviewer is unavailable, report blocked/unavailable. Do not substitute self-review. Refresh bindings after approval. A changed packet invalidates it.

Report actionable-clear or blocked, findings, evidence gaps, source identity, and any applied changes. Actionable-clear means the issue is ready for the next requested step. It does not prove implementation or authorize status changes. Use `/issues:check-issue-status` for delivery evidence and `/issues:acceptance-review` for acceptance.
