---
name: design-review
description: Assess a requested interface or flow for hierarchy, usability, visual consistency, and accessibility evidence. Use with repository source and optional rendered or design references.
---

# Design review

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

Read `${CLAUDE_PLUGIN_ROOT}/docs/interface-review.md` for shared criteria and
accessibility evidence requirements. Establish repository evidence with
`${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`.

## Establish the design subject

Identify the requested route, component, or user flow and its primary task.
Discover application and UI source locations from repository manifests, imports,
and guidance. Read local wrappers, tokens, theme definitions, examples, and any
design contract before judging usage. Do not assume component APIs or font choices.

Use a supplied URL, screenshot, or Figma reference as optional evidence. Use
browser or Figma tools only if available. Do not start a server or install tools.
Record the source revision and the rendered URL or design node, viewport, theme,
state, and retrieval time where available. A source-only review can continue,
but rendered appearance and interaction claims remain unverified.

## Review the task and states

Trace how a user discovers the primary action, understands required input,
receives feedback, recovers from errors, and completes the task. Review hierarchy,
density, spacing, typography, labels, control grouping, and component consistency.
Use the shared criteria for responsive layouts, keyboard and focus behavior,
overlays, loading, empty, error, and disabled states.

Compare against the repository's actual design contract and supplied references.
Separate a preference from a contract violation or a demonstrated usability defect.
For each concern, cite source or rendered evidence, explain the affected task,
and suggest a bounded change. Do not require an arbitrary count of suggestions.
Do not claim accessibility compliance without the primary criterion and evidence
required by the shared guide.

## Report

Use the contract's report shape. Include observed and unobserved states, source
and rendered coverage, findings in impact order, and a short repair sequence.
Give effort estimates only when the source supports them, with uncertainty.
Do not edit components, create a redesign, or update visual baselines.
For deeper source review, suggest `/audits:frontend-review`. For a supplied Figma
file, `/audits:figma-review` is an optional follow-up. Do not start them automatically.
