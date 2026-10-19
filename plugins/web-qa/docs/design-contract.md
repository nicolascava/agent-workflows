# Interface implementation contract

Start with the intended user, their task, and the primary action. Read the local
routes, component wrappers, tokens, themes, styles, and representative consumers.
Local component source defines the API. Do not assume a library prop exists on a
repository wrapper. Preserve a coherent design direction unless the request
calls for a new one.

For a new direction, describe the information hierarchy, density, typography,
color roles, surface treatment, and one useful distinguishing detail. Tie each
decision to the task. For an existing screen, prefer a bounded change that fits
its surrounding product. Use domain language in labels and realistic, generic
content in examples.

## Tokens and components

Use semantic color, spacing, typography, radius, elevation, and motion tokens.
Read how tokens change across supported themes. Avoid raw colors and arbitrary
values when an existing token fits. Add a shared token only when it expresses a
reusable role. Check computed contrast in the rendered state before claiming a
contrast result.

Reuse local controls and their documented sizes and variants. Inspect consumers
before extending a wrapper. Keep small leaf components simple. Add compound
composition when multiple parts need shared state or context, rather than to
imitate a library pattern. Keep public props aligned with actual use cases.
Avoid adding a broad abstraction for one screen.

## States and behavior

Define loading, empty, success, error, disabled, validation, and permission states
that apply to the flow. Errors should explain recovery and preserve useful
input. Test long text, missing media, narrow and wide layouts, zoom, and each
supported theme. Prevent clipping, accidental horizontal scrolling, unstable
shifts, and hidden primary actions.

Use native semantics where possible. Give controls accessible names, associate
labels and descriptions, and provide meaningful alt text. Verify keyboard use,
visible focus, and state announcements when relevant. Overlays need appropriate
focus entry, containment, escape, return, scrolling, and background interaction.
Respect reduced motion. Check target size and contrast against the applicable
primary criterion before making compliance claims.

## Implementation and verification

Keep state near its consumers. Measure before introducing memoization or loading
complexity. Size images to limit layout shifts. Justify import, rendering, and
animation costs with evidence. Prefer transform and opacity for motion when they
fit the interaction. Avoid motion that obscures state changes.

Review the implementation against the chosen direction and local contract. Run
the repository's focused checks. Verify behavior in the browser using
`${CLAUDE_PLUGIN_ROOT}/docs/browser-workflow.md`. Inspect screenshots at the
relevant sizes and themes. Where baselines exist, inspect actual, expected, and
diff images together. Baseline updates need the user's request and a review of
the intentional change.

Record what was rendered and what was inferred from source. Source alone cannot
prove focus behavior, accessible tree output, screen-reader behavior, or computed
contrast. Before an accessibility compliance claim, read the exact criterion at
`https://www.w3.org/WAI/` or `https://www.w3.org/TR/` and cite it beside the
observed evidence. Describe unverified issues as concerns with verification
steps. Do not call an automated scan a compliance certificate.

Update repository design documentation only when a requested implementation
changes a durable contract. Keep the explanation close to the component or token
it governs. Report affected files, state and viewport coverage, test results,
artifact paths, and any limits.
