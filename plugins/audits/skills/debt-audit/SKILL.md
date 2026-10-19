---
name: debt-audit
description: Assess technical debt from verified repository evidence. Use to prioritize bounded maintenance work across architecture, dependencies, tests, delivery, and operations.
---

# Debt audit

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

## Establish evidence

Scope the repository and requested areas. For multiple repositories, require
explicit targets and keep their evidence boundaries and findings separate.
Read repository guidance, manifests, dependency locks, architecture notes,
test configuration, and delivery definitions. Discover their locations.

Follow `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md` for each target. Default
to its pinned committed snapshot. When the user requests a live-worktree fetch,
use `${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts` after the guide's preview.
Supply the explicit base branch and configured remote. A failure blocks live
source verification; do not reuse stale refs. Bind dirty content with the hashes
the guide requires. If live evidence is required but unavailable, report blocked.

## Assess debt

- Architecture: module ownership, dependency direction, coupling, duplicate
  concepts, unclear boundaries, and changes that spread across unrelated areas.
- Dependencies: unused or duplicate packages, lifecycle risk, locked provenance,
  and existing security or update evidence. Without current advisory evidence,
  do not claim a package is vulnerable or unsupported from memory.
- Reliability: error handling, validation, transaction boundaries, retries,
  observability, recovery, and existing regression coverage.
- Delivery: documented commands, reproducible setup, CI checks, release controls,
  and approval evidence tied to the delivered revision.
- Maintenance: complex hotspots, stale documentation, test gaps, generated code
  ownership, and framework conventions supported by the repository.
- Infrastructure and UI: configuration drift, operational burden, inconsistent
  local components, accessibility concerns, and expensive patterns where relevant.

Judge review and merge controls against this repository's declared policy. Do not
impose a particular merge actor or tracker. Include agent and generated-code
risks only where those features are present. Inspect existing lint and test
outputs; do not execute repository commands during this read-only audit.

For each candidate, trace concrete examples and counterexamples. Explain the
maintenance or failure cost. Separate intentional tradeoffs, obsolete notes,
and unproved suspicions from debt. Avoid a composite score with no defined basis.

## Prioritize and report

Use the contract's report shape. Group findings by area. Give each a bounded
remediation, expected impact, dependencies, rough effort with uncertainty, and a
way to verify improvement. Prioritize by observed risk and change friction.
Identify small repairs separately from larger architectural work. Do not turn
the audit into implementation, issue creation, or a general rewrite proposal.
Suggest `/audits:domain-audit` or `/audits:code-quality-audit` for deeper review
when useful, without starting them automatically.
