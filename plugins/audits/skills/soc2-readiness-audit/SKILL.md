---
name: soc2-readiness-audit
description: Assess technical SOC 2 readiness against applicable trust services criteria using repository evidence. Use for control mapping and evidence gaps, not an attestation.
---

# SOC 2 readiness audit

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

Read `${CLAUDE_PLUGIN_ROOT}/docs/soc2-controls.md` for the criteria map and evidence
limits. This assessment is not an attestation, certification, auditor opinion,
or proof of operating effectiveness.

## Establish scope

Identify the repository, system boundary, requested criteria categories, and
review period if supplied. Discover architecture, deployment, security, test,
and operational documentation from repository guidance and configuration.
Bind code evidence using `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`.
Record unknown organizational scope rather than inventing a profile.

Use only repository evidence and relevant material the user explicitly supplies.
Do not retrieve personnel records, credentials, or unrelated account data.
Separate current control design from historical operating evidence.

## Map controls

1. Review identity, authentication, authorization, access lifecycle, least
   privilege, secrets, encryption, and audit events against applicable criteria.
2. Inspect vulnerability handling, dependency provenance, incident guidance,
   monitoring, backup configuration, restore procedures, and recovery evidence.
3. Review change authorization, tests, approvals, release identity, deployment
   restrictions, and rollback against this repository's declared policy. Verify
   that evidence applies to the delivered revision. Do not impose a merge actor,
   issue tracker link, or a particular hosting feature.
4. Where in scope, inspect data validation and reconciliation, confidentiality,
   retention and disposal, privacy-related data flows, and request handling.
5. For agents and generated code, review tool authority, data boundaries,
   approval, evaluation, provenance, and traceability as relevant control evidence.

For each applicable control, record its criteria family, evidence and source,
status, gaps, confidence, and additional evidence needed. Use `supported`, `gap`,
`unknown`, or `not-applicable` as defined in the control guide. Do not convert a
missing policy or live record into proof of failure without supporting evidence.
Read existing results; do not run tests, inspect live infrastructure, or change
access controls during this repository assessment.

## Report

Use the contract's report shape. Include a control matrix, evidenced findings,
unknowns, and a bounded readiness plan. Identify evidence that needs organizational
or operational review without fetching it. Do not assign an invented compliance
percentage, promise an audit outcome, or present the result as an attestation.
Suggest `/audits:security-audit` for deeper technical findings when useful.
