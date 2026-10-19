# Browser workflow

Read the target repository's guidance and inspect its manifests, workspace map,
lockfiles, test configuration, and scripts. Find the application directory,
package manager, dev command, browser test command, and running URL. Resolve
conflicting lockfiles or missing commands with the user. Do not infer a dev port.
Keep commands scoped to the application and quote paths.

Use Playwright installed in the target repository when available. Otherwise use
an available browser tool. State any gap in assertions, screenshots, or recording
support. A missing tool is a blocker for that capability, not proof of a pass.
Never install a package or browser without the user's request. Show the exact
installation command before running it. State required tools without prescribing
a system package manager.

Reuse a running server at its observed URL. Never stop or restart a server the
user runs. If a server is needed, discover its command and free-port option,
start your own on a free port, verify readiness, and record its process identity.
Stop only that process before finishing, including after failures. Review test
configuration, setup hooks, and scripts for automatic server management before
running them. Disable that management when it could affect an existing server.

Select the smallest useful flow from the request and changed routes or
components. Include the happy path and relevant loading, empty, validation,
error, disabled, and permission states. Use controlled data and repository test
authentication fixtures. Avoid live destructive actions or data resets without
the user's request. Do not expose credentials or personal data in artifacts.

Prefer accessible roles, labels, and stable repository test identifiers. Wait for
an observable condition, such as a loaded heading or completed response. Avoid
fixed sleeps as readiness checks. Assert the result of an action, not just its
click. Close only pages or browser contexts created for this task.

Before capture, record the revision, route, viewport, device scale, browser,
theme, locale, state, and data setup. Let fonts and images settle. Freeze time,
animations, or unstable content only when the test contract permits it. Record
masks and their reasons. A mask must not hide the behavior under test.

Use repository artifact locations for ordinary test output. Ask for a path when
none is defined. Videos always need a user-chosen output path. Keep baselines in
the repository's existing location or a user-chosen directory. Updating a
baseline requires the user's request. Do not use an update flag to make a
failing comparison pass.

Report scope, exact commands, environment, observed outcomes, artifact paths,
failures, skipped coverage, and cleanup. Separate rendered observations from
source-based expectations. A screenshot alone does not prove keyboard behavior,
focus order, accessible tree output, or computed contrast. Before claiming
accessibility compliance, read and cite the applicable primary W3C WAI or TR
criterion and record the evidence. An automated scan is not a certificate.
