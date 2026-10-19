---
name: webapp-testing
description: Test a local web application with repository Playwright or an available browser tool. Use for functional browser checks, UI debugging, and focused test coverage.
---

# Web application testing

Read `${CLAUDE_PLUGIN_ROOT}/docs/browser-workflow.md` and
`${CLAUDE_PLUGIN_ROOT}/docs/design-contract.md` before testing.

1. Discover the app directory, package manager, test and dev commands, existing
   browser configuration, and running URL. Reuse a user-run server. If a command
   or URL is unclear, ask. Never install missing tools without the user's request
   and an exact command preview.
2. Map the request and changed routes to scenarios. Prefer an existing focused
   test. Cover the primary task and relevant loading, empty, validation, error,
   disabled, and permission states. State the scope before a long run.
3. Run the smallest relevant checks with the repository's installed Playwright.
   If it is absent, use an available browser tool and describe coverage limits.
   Keep authentication and data setup consistent with repository fixtures.
4. Navigate, act, wait for an observable condition, and assert the visible or
   persisted result. Prefer role and label locators. Capture console errors and
   failed requests relevant to the flow. Inspect their causes before attributing
   every browser warning to the change.
5. Capture screenshots where they help explain behavior. Include viewport, theme,
   route, and state. For an intended visual comparison, use
   `/web-qa:visual-regression`. Baseline changes need the user's request.
6. If asked to fix a defect, reproduce it first, make the smallest supported fix,
   and rerun the failing scenario and relevant repository checks. Keep observed
   failures distinct from environment problems and untested source expectations.
7. Close task-owned browser contexts and stop any server you started. Report
   commands, pass and fail results, artifacts, skipped scenarios, and cleanup.

`/core:verify` is an optional follow-up when installed and requested. This skill
works without it.
