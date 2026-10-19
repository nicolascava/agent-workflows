---
name: documentation-review
description: Review repository documentation for accuracy, consistency, completeness, and usability. Use to compare written guidance with verified implementation and current repository policy.
---

# Documentation review

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

## Inventory and scope

Establish the repository and source boundary using
`${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`. Discover tracked Markdown,
README files, runbooks, API references, configuration examples, and relevant code
comments. Follow repository guidance about generated docs and historical records.
Count reviewed and excluded files. State any sampling. Do not access excluded
directories or assume a fixed documentation tree.

Group documents by purpose: onboarding, development, architecture, operations,
API use, and plans or decisions. Identify canonical sources for commands,
configuration, terminology, and policy. Distinguish intended behavior and
historical decisions from claims about the current implementation.

## Review

1. Compare setup commands, paths, environment variable names, examples, links,
   and interfaces with the pinned implementation and configuration. Inspect
   commands without executing them. Do not read secret values to validate examples.
2. Check documents against each other for conflicting rules, names, and duplicated
   guidance. Prefer the declared source of truth; report ambiguity if none exists.
3. Check onboarding, prerequisites, ownership, failure handling, recovery, and
   task completion steps for gaps that would block a reader.
4. Assess clarity, structure, navigation, and examples for the intended audience.
   Keep wording preferences separate from incorrect or missing instructions.
5. For stale-looking material, inspect history and present behavior. Age alone
   does not prove a defect. Do not rewrite a historical record as current policy.

Verify each candidate against its referenced source and counterexamples. A local
link check does not prove an external URL works. External checks are optional
when a read tool is available; record retrieval time and inaccessible links.
Recheck source identity before reporting. Do not silently fix documents or run
generators. If the scope needs another review pass, state what remains uncovered.

## Report

Use the contract's report shape. Include the inventory and coverage, contradictions
with both locations, missing guidance, and bounded corrections. Highlight up to
five priorities supported by the evidence. Show proposed wording only when useful;
it remains a suggestion. File exports, edits, issues, and comments require the
user's request and a target and content preview first.
