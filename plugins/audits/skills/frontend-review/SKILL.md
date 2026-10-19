---
name: frontend-review
description: Review frontend source for component contracts, semantics, state handling, responsiveness, and performance risks. Use for a scoped UI code assessment with optional browser or Figma evidence.
---

# Frontend review

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

Read `${CLAUDE_PLUGIN_ROOT}/docs/interface-review.md` for shared criteria and
accessibility evidence requirements. Establish repository evidence with
`${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`.

## Discover the implementation

Identify requested pages, components, or flows. Discover application entry points,
UI packages, route structure, manifests, and style configuration from the target
repository. Read local component wrappers and representative call sites before
checking usage. Identify supported themes, viewports, and framework conventions.
Do not assume source locations, library APIs, or a particular utility framework.

## Review source and behavior

- Check component composition, prop contracts, state ownership, data fetching,
  asynchronous races, effect cleanup, error handling, and form validation.
- Check semantic elements, accessible names, labels, alt text, keyboard handlers,
  focus management, overlays, and reduced-motion handling using shared criteria.
- Compare tokens, variants, spacing, responsive rules, long content, loading,
  empty, error, and disabled states with local contracts and examples.
- Inspect import boundaries, bundle splitting, image dimensions and loading,
  unnecessary rendering, and animation work. Explain the reachable cost before
  recommending a change. Do not assert measured speed from source inspection.
- Read existing component, accessibility, and visual tests and their results.
  Identify missing cases. Do not run checks or update baselines in this audit.

Browser and Figma tools are optional inputs when available and supplied within
scope. Record their URL or node, revision, state, viewport, theme, and retrieval
time where available. Without runtime evidence, do not claim computed contrast,
actual layout overflow, focus behavior, or screen-reader output was verified.
Do not start a server, install tools, or interact with controls that change data.

Check callers, wrapper behavior, and existing tests before confirming a finding.
Keep framework preferences separate from defects or documented contract gaps.
If check execution is separately requested, discover repository commands and
show them and their possible writes first. `/core:verify` is optional if installed.

## Report

Use the contract's report shape. Include source coverage, optional runtime
coverage, findings with exact locations, and a bounded repair order. Mark which
claims still need rendered verification. Suggest `/audits:design-review` for a
task-focused design review when useful. Do not begin implementation or publication.
