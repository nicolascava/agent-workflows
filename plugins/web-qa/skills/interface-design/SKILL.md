---
name: interface-design
description: Design and implement application interfaces using local tokens, components, states, and accessibility contracts. Use for screens, forms, dashboards, and interactive UI changes.
---

# Interface design

Read `${CLAUDE_PLUGIN_ROOT}/docs/design-contract.md`. It defines the implementation
contract for tokens, components, states, accessibility, performance, and evidence.

1. Identify the user, task, primary action, and requested change. Discover local
   app and UI code, design guidance, semantic tokens, wrappers, supported themes,
   and existing screens. Read wrapper APIs and representative consumers.
2. Choose a direction that fits the task and surrounding product. For a new
   direction, describe hierarchy, density, type, color roles, surfaces, and one
   distinguishing interaction or detail. Make decisions concrete before editing.
3. Implement with local primitives and tokens. Keep leaf components simple and
   compose shared behavior only when the consumers need it. Avoid invented props,
   one-screen abstractions, and arbitrary colors when the system provides a fit.
4. Include relevant loading, empty, success, error, disabled, validation, and
   permission states. Verify semantics, labels, keyboard operation, focus,
   overlays, responsive layout, reduced motion, long content, and supported themes.
5. Run focused repository checks. For rendered verification, follow
   `${CLAUDE_PLUGIN_ROOT}/docs/browser-workflow.md` and use
   `/web-qa:webapp-testing`. Use `/web-qa:visual-regression` when baseline comparison
   is relevant. Baseline updates require the user's request.
6. Inspect the result against the chosen direction. Report implemented files,
   behavior, state and viewport coverage, checks, and any source-only assumptions.
   Update local design documentation only when the change establishes or alters a
   durable shared contract.

`/core:verify` is optional when installed and requested. An independent read-only
review can use `/audits:frontend-review` when that plugin is installed.
