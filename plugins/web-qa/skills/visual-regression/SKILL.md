---
name: visual-regression
description: Capture UI screenshots and compare them with approved baselines. Use for layout, theme, component, and responsive visual regressions.
---

# Visual regression

Read `${CLAUDE_PLUGIN_ROOT}/docs/browser-workflow.md` and
`${CLAUDE_PLUGIN_ROOT}/docs/design-contract.md`.

1. Discover the repository's screenshot tests, comparison tool, baseline path,
   thresholds, browser versions, fonts, viewport matrix, and supported themes.
   Use installed Playwright when present, otherwise an available browser tool.
   Do not install tools or browsers without a user request and command preview.
2. Choose representative changed components and routes. Include their relevant
   loading, empty, error, disabled, validation, and overlay states. Select narrow
   and wide viewports and supported themes based on the change. Record omissions.
3. Keep data, fonts, locale, device scale, browser, animation handling, and capture
   readiness stable. Explain masks. Never mask the area being tested. Reuse an
   existing server under the shared browser workflow.
4. Capture actual screenshots to the repository's artifact location or a chosen
   path. Compare with the existing baselines using the repository's comparator
   and thresholds. If no baselines exist, report that comparison is blocked and
   offer a proposed baseline set. Creating or updating baselines needs the user's
   request and an agreed path. Keep comparison runs free of update flags.
5. Inspect the actual, expected, and diff images together. Identify the affected
   region, pixel or ratio difference when available, user-visible impact, and
   likely source. Distinguish a regression from an intentional change or unstable
   environment. Do not loosen thresholds to conceal a defect.
6. Fix a regression only within the requested implementation scope, then recapture
   and compare. For a requested baseline update, preview the file set, explain
   each intentional change, update only those files, and rerun the comparison.
7. Report the scenario matrix, baseline and actual paths, diff paths, thresholds,
   results, uncertain causes, and cleanup. Missing comparison tooling or a browser
   screenshot alone cannot establish a numerical visual pass.

Use `/web-qa:webapp-testing` for related functional behavior. `/core:verify` is an
optional follow-up when installed and requested.
