---
name: security-audit
description: Review repository security boundaries, code, configuration, and existing scanner evidence. Use for a scoped security assessment with verified findings and coverage limits.
---

# Security audit

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

## Establish scope

Identify the target repository, revision or current worktree, entry points,
deployment surfaces, and exclusions. Discover source and configuration locations
from manifests, imports, and repository guidance. Bind evidence using
`${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md` before making code claims.
Do not inspect unrelated repositories, credentials, or live user data.

Build a small security graph: assets, identities, trust boundaries, inputs,
data stores, dependencies, external services, and privileged operations. Trace
reachable paths through that graph. State which surfaces could not be inspected.

## Review evidence

1. Review authentication, session handling, authorization at each sensitive
   operation, cross-tenant isolation where present, and privilege changes.
2. Trace untrusted input through validation, query construction, rendering,
   uploads, deserialization, redirects, and command or file operations.
3. Inspect secrets handling, encryption configuration, logging, error disclosure,
   dependency provenance, deployment permissions, and recovery controls.
4. Review business invariants around money, state transitions, concurrency,
   retries, webhooks, queues, replay protection, and idempotency where applicable.
5. For agents and AI features, inspect prompt and data boundaries, tool authority,
   approvals, identity, output handling, evaluations, and incident traceability.

Treat static analysis, secret scanning, and dependency analysis as distinct
coverage areas. Read existing scanner outputs when available. For each, record
tool and version, invocation, ruleset, targets, exclusions, subject OIDs, run time,
and raw artifact or CI run identifier. Missing scanner output is missing coverage.
Do not install or run scanners in the default read-only audit. If checks are
requested separately, discover the repository's commands and explain writes first.

Normalize alerts by rule, location, severity, and evidence. Trace the actual
failure path and check mitigations before confirming an alert. Record each as
confirmed, false positive, accepted risk, or unresolved. Accepted risks need
scope, rationale, owner role, and expiry when available. Never print secret
values; identify only their safe location and exposure class.

## Report

Use the contract's report shape. Include the security graph summary, coverage by
surface and scanner type, confirmed findings, unresolved hypotheses, and a small
set of next steps. Distinguish exploitable paths from configuration concerns.
Do not label the repository secure because no alerts were available.
If a narrower follow-up is useful, suggest `/audits:domain-audit` or
`/audits:debt-audit`. Do not start a writing workflow.
