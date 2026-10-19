# agent-workflows

A free Claude Code plugin marketplace of engineering workflows.

The `core` plugin provides engineering skills and verification support.
The `git-flow` plugin provides Git delivery workflows.
The `issues` plugin provides issue intake, planning, and acceptance review.
The `audits` plugin provides repository assessments and design reviews.
The `web-qa` plugin provides interface implementation, browser checks, and recordings.
The `codex` plugin provides optional task delegation through the Codex CLI.
Other plugins are coming soon.

| Plugin | Purpose | Status |
| --- | --- | --- |
| `core` | Test-driven development, code review, and dependency updates. | available |
| `git-flow` | Branches, worktrees, and authorized change delivery. | available |
| `issues` | Issue planning, creation, and repository-bound tracking. | available |
| `audits` | Read-only engineering audits with scoped evidence and findings. | available |
| `web-qa` | Interface design, visual review, and web quality assurance. | available |
| `codex` | Opt-in Codex CLI integration. | available |
| `specialists` | Specialist agents for engineering advice and review. | coming soon |

After publication, run these commands in Claude Code:

```text
/plugin marketplace add nicolascava/agent-workflows
/plugin install core@agent-workflows
/plugin install git-flow@agent-workflows
/plugin install issues@agent-workflows
/plugin install audits@agent-workflows
/plugin install web-qa@agent-workflows
/plugin install codex@agent-workflows
```

Requirements: Claude Code, git, gh, bun, and jq.
The `codex` plugin also requires the Codex CLI installed and signed in with ChatGPT.

Plugin skills use namespaced commands, such as `/core:tdd`.
Core skills: `tdd`, `debug`, `condense`, `verify`, `review`,
`adversarial-review`, `skill-review`, `context-diet`, and `update-deps`.

Git-flow skills: `commit`, `create-branch`, `land`, `merge`, `pr`, `update-pr`,
`rebase`, `resolve-conflicts`, `apply-pr-feedback`, and `execute-test-plan`.
Use namespaced commands such as `/git-flow:pr`.
Git-flow requires `core`, declared through the plugin manifest's `dependencies` field.
Install both from this marketplace. Its helpers use their own installed plugin root;
[shared helper conventions](plugins/git-flow/docs/safety.md) explain the copied verification helper.

Declare the target repository's mode in root `git-workflow.json`:
`{ "workflow": "pr" }` for PR delivery, or
`{ "workflow": "solo-shaped-kanban" }` for reviewed squash landing through `land`.
Missing or unknown modes stop mode-dependent mutations.
[Workflow modes](plugins/git-flow/docs/workflow-modes.md) documents the mode table and optional
`baseBranch` and `branchPrefix` settings.

Issues skills: `create-issue`, `triage`, `project`, `review-issue`,
`check-issue-status`, `acceptance-review`, and `github-waiting-replies`.
Use namespaced commands such as `/issues:triage`. Issues requires `core`, declared
through the plugin manifest's `dependencies` field. Install both from this marketplace.
Git-flow is optional. Configure repository-owned board names, options, and native
issue types in [issue-workflow.json](plugins/issues/docs/configuration.md).
Without a board, creation and body refinement use plain issues with a clear message.
Writes require the user's request and a payload preview. Acceptance publication
requires fresh approval of the final bundle.

Audits skills: `security-audit`, `debt-audit`, `domain-audit`,
`soc2-readiness-audit`, `code-quality-audit`, `codebase-review`,
`documentation-review`, `design-review`, `frontend-review`, `figma-review`,
and `team-health-analysis`. Use namespaced commands such as `/audits:security-audit`.
Audits has no hard plugin dependency. Its source helper is vendored locally;
`/core:verify` and `/core:review` are optional follow-ups when installed and requested.
The [assessment contract](plugins/audits/docs/assessment-contract.md) defines evidence,
severity, findings, verification, and report disposition. Reports stay in the conversation
by default. Writes require the user's request and a target and content preview.
Report files require a user-chosen path. Browser tools are optional. Figma review
requires a user-supplied URL and an installed Figma MCP server.
The [source guide](plugins/audits/docs/verification-source.md) explains committed
snapshots and requested fetches for live worktree evidence.
SOC 2 readiness is a technical review, not an attestation.

Web-qa skills: `webapp-testing`, `visual-regression`, `e2e-video`,
`walkthrough-video`, `interface-design`, and `setup-ci`. Use namespaced commands such as
`/web-qa:webapp-testing`. Web-qa has no hard plugin dependency. Core verification
and audits reviews are optional. It discovers app paths, package managers,
commands, and URLs from the target repository. Browser checks use installed
Playwright or an available browser tool. Recordings require Bun, ffmpeg, and
ffprobe. Optional narration uses a detected local voice. Tools are never installed
without a user request and command preview. Videos use user-chosen output paths.
Baseline updates require the user's request. See the
[browser workflow](plugins/web-qa/docs/browser-workflow.md),
[design contract](plugins/web-qa/docs/design-contract.md), and
[video tools](plugins/web-qa/docs/video-tools.md).
CI setup uses discovered commands and pinned checks-only templates. Workflow writes
require a path and full content preview. Optional scanners retain their upstream
licenses and provenance in the [CI guide](plugins/web-qa/docs/ci-checks.md).

Codex skills: `codex`. Use `/codex:codex` for bounded delegation.
The default is read-only. Explicit `--write` disables the filesystem sandbox.
Pace output is advisory. Provider examples are optional and copied by hand;
installing this Claude plugin does not configure Codex. See the
[Codex setup guide](plugins/codex/docs/codex-setup.md) for sign-in, settings,
command rules, and helper limits.

## Hooks

`core` adds documentation guidance at session start.
It also points to [Next.js guidance](plugins/core/docs/nextjs.md) when the target
package or a declared package workspace lists `next` in runtime or development dependencies.
Hooks use the input `cwd`, with `CLAUDE_PROJECT_DIR` as a fallback.
They validate `CLAUDE_PLUGIN_ROOT` against the physical installation path.
Input has a two-second deadline and a 1 MiB size limit.
Invalid input emits no advisory context. The shared guard shim denies invalid calls.

Formatting after `Write`, `Edit`, or `NotebookEdit` is off by default.
Start Claude Code with `CORE_FORMAT_AFTER_EDIT=1 claude` to enable it.
The hook uses a `format` script, then a `lint:fix` script, with the package manager
selected by the target package's lockfile. Conflicting lockfiles skip formatting.
Without a matching script and lockfile, it looks for a Prettier, Biome, or ESLint
config and its installed executable in `node_modules/.bin`.
It never installs tools. Missing formatters and files outside the target package are skipped.
Formatter commands have a ten-second deadline. Their output is discarded.
Generated directories such as `node_modules`, `.next`, `dist`, and `build` are skipped.
The formatter uses the edited file path. `NotebookEdit` events without a file path are skipped.

Registrations live in [hooks/hooks.json](plugins/core/hooks/hooks.json).
They follow the [Claude Code plugin hooks reference](https://code.claude.com/docs/en/plugins-reference#hooks)
and [hook handler schema](https://code.claude.com/docs/en/hooks#configuration).
The dispatcher and guard shim contain no repository policy hooks.

## Git-flow Hooks

Git-flow checks branch creation, GitHub creation and base-branch pushes before a tool runs.
Agent branch prefixes are denied. A declared `branchPrefix` requires `<branchPrefix>/<slug>`.
Repository creation asks for confirmation. PR creation requires `pr` mode.
Admin merge overrides and force pushes to the base are denied.
Direct base pushes require `solo-shaped-kanban` mode.
The hooks read the same declaration parser as the mode helper and make no network calls.
Declare `baseBranch`, or keep a local `origin/HEAD` symbolic ref, for base push checks.

Session start can restore an existing repository-owned hooks path in a linked worktree.
It also warns above 20 registered worktrees. Set `GIT_FLOW_WORKTREE_BUDGET` to a positive
integer to change the threshold, or `0` to disable that advisory.
Hooks validate `CLAUDE_PLUGIN_ROOT`. They use input `cwd`, then `CLAUDE_PROJECT_DIR`
when `cwd` is absent. Bun must be on `PATH`. Guards deny malformed or unresolved guarded calls.
The [hook notes](plugins/git-flow/docs/hooks.md) cover decisions, limits and the copied runtime.
The [eval scenarios](plugins/git-flow/evals/README.md) describe manual checks.

Licensed under the [MIT License](LICENSE).
See [CONTRIBUTING.md](CONTRIBUTING.md) for local checks.
