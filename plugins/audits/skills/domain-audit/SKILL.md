---
name: domain-audit
description: Review domain models, invariants, state transitions, and data integrity in a repository. Use to find evidenced logic defects and gaps in domain boundaries.
---

# Domain audit

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

## Establish evidence

Identify the requested repository, domain, and flows. If several repositories
are requested, verify each and separate their findings. Discover models,
schemas, migrations, services, API handlers, jobs, and tests from the repository.
Use synthetic examples; never query live personal data or credential stores.

Follow `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md` for each target. Default
to its pinned committed snapshot. When the user requests a live-worktree fetch,
use `${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts` after the guide's preview.
Supply the explicit base and remote. Stop live-source claims if it fails. Record
the dirty content hashes required by the guide before inspecting local changes.
If live evidence is required but unavailable, report blocked.

## Model and trace

1. Map entities, value objects, aggregates, relationships, and ownership. Identify
   the authoritative source of each concept. Note conflicting representations.
2. Extract invariants from code, schema constraints, tests, and documentation.
   Label inferred intent as an assumption. Do not invent domain requirements.
3. Trace key use cases from entry point to persistence and side effects. Check
   authorization, tenant boundaries, validation, and state transition guards.
4. Inspect transaction boundaries, uniqueness, concurrency, locking, retries,
   deduplication, idempotency, event ordering, and partial failure handling.
5. Where applicable, review money representation and rounding, units, identifiers,
   time zones, date boundaries, deletion, retention, and reconciliation.
6. Compare tests with actual invariants and failure paths. Inspect existing
   results and their subject. Do not run tests or change schemas in this audit.

Distinguish a database constraint from application-only validation. For a suspected
race or replay defect, describe two concrete operations and the resulting state.
Check callers, guards, and compensating actions before confirming it. Keep
unresolved domain questions visible instead of turning guesses into defects.
For agent-driven state changes, inspect tool authority and approval boundaries.

## Report

Use the contract's report shape. Include a compact domain map, supported
invariants, gaps, and findings in impact order. Each finding names the broken
invariant, entry path, evidence, consequence, bounded recommendation, and a
verification scenario. Separate model clarity improvements from integrity risks.
Suggest `/audits:security-audit` for a deeper authorization assessment when useful.
Do not implement changes or open issues as part of the review.
