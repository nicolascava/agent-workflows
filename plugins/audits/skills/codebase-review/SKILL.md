---
name: codebase-review
description: Review a repository across correctness, architecture, security, tests, and maintainability. Use for a broad codebase assessment beyond a single diff.
---

# Codebase review

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

## Map the repository

Establish the requested repository and source boundary using
`${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`. Read repository guidance,
workspace manifests, entry points, architecture notes, test configuration,
and delivery definitions. Discover owned source roots and generated or vendored
areas. State included files, exclusions, and any sampling strategy. This is a
codebase review; a recent diff alone does not establish whole-repository coverage.

## Inspect the system

Trace representative critical flows through entry points, authorization,
validation, domain behavior, persistence, side effects, and error handling.
Review module boundaries, dependency direction, public interfaces, duplication,
types, dead code, and consistency with local conventions. Check data integrity,
concurrency, retries, resource lifetimes, and security-sensitive operations.
Review performance risks only where code paths or existing measurements support
them. Include agent authority and generated-code controls where applicable.

Read tests and existing check outputs. Compare coverage to critical branches and
failure modes. Discover build, lint, type, and test commands from the repository's
own configuration. Do not execute them in the default read-only review.
Missing check results are coverage gaps. If execution is separately requested,
show commands and possible writes first. `/core:verify` is optional if installed.

Verify each candidate by reading callers, guards, tests, and counterexamples.
Keep style preferences and refactoring ideas separate from defects. Use evidence
and bounded recommendations rather than a speculative rewrite. Recheck the
source boundary before finalizing findings.

## Report

Use the contract's report shape. Include a short system map, coverage, the most
consequential findings, and a practical repair order. Do not imply that sampled
areas or unrun checks passed. For focused follow-up, suggest
`/audits:security-audit`, `/audits:domain-audit`, or
`/audits:code-quality-audit`. For an independent change review,
`/core:review` is optional if installed. Do not start another workflow automatically.
