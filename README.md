# agent-workflows

A free Claude Code plugin marketplace of engineering workflows.

## Install

Run these commands in Claude Code, keeping only the plugins you want:

```text
/plugin marketplace add nicolascava/agent-workflows
/plugin install core@agent-workflows
/plugin install git-flow@agent-workflows
/plugin install issues@agent-workflows
/plugin install audits@agent-workflows
/plugin install web-qa@agent-workflows
/plugin install codex@agent-workflows
/plugin install gemini@agent-workflows
/plugin install grok@agent-workflows
/plugin install specialists@agent-workflows
```

You need Claude Code, `git`, `gh`, `bun`, and `jq`.

## Plugins

| Plugin | What it does | Needs |
| --- | --- | --- |
| `core` | Test-driven development, debugging, review, verification, and dependency updates. | Nothing else |
| `git-flow` | Branches, commits, pull requests, and squash landing. | `core` |
| `issues` | Issue creation, triage, planning, and acceptance review. | `core` |
| `audits` | Read-only audits of security, debt, code, docs, and design. | Nothing else |
| `web-qa` | Browser tests, visual checks, demo videos, interface design, and CI setup. | Nothing else |
| `codex` | Hands a bounded task to the Codex CLI. | Codex CLI signed in with ChatGPT |
| `gemini` | Cross-checks completed web research with Antigravity CLI. | Antigravity CLI (`agy`) signed in with Google |
| `grok` | Cross-checks completed web research with the Grok CLI. | Official Grok CLI signed in with a subscription |
| `specialists` | Focused agents for engineering advice, implementation, and review. | Nothing else |

Commands carry the plugin name, such as `/core:tdd` or `/git-flow:pr`. Agents do too, such as `specialists:code-reviewer`.

- `core`: `tdd`, `debug`, `condense`, `verify`, `review`, `adversarial-review`, `skill-review`, `context-diet`, and `update-deps`.
- `git-flow`: `commit`, `create-branch`, `land`, `merge`, `pr`, `update-pr`, `rebase`, `resolve-conflicts`, `apply-pr-feedback`, and `execute-test-plan`.
- `issues`: `create-issue`, `triage`, `project`, `review-issue`, `check-issue-status`, `acceptance-review`, and `github-waiting-replies`.
- `audits`: `security-audit`, `debt-audit`, `domain-audit`, `soc2-readiness-audit`, `code-quality-audit`, `codebase-review`, `documentation-review`, `design-review`, `frontend-review`, `figma-review`, and `team-health-analysis`.
- `web-qa`: `webapp-testing`, `visual-regression`, `e2e-video`, `walkthrough-video`, `interface-design`, and `setup-ci`.
- `codex`: `codex`.
- `gemini`: `gemini`.
- `grok`: `grok`.
- `specialists`: `api-engineer`, `backend-engineer`, `code-reviewer`, `context-engineer`, `copy-editor`, `dba`, `economy-researcher`, `frontend-engineer`, `infrastructure-engineer`, `integration-and-rollout-reviewer`, `model-policy-reviewer`, `product-prioritization-assistant`, `repository-librarian`, `technical-writer`, `test-designer`, `triager`, `ui-designer`, and `ux-designer`.

## Setup

Declare how changes land in a root `git-workflow.json`. Use `{ "workflow": "pr" }` for pull requests, or `{ "workflow": "solo-shaped-kanban" }` to land reviewed work as one squashed commit through `land`. Without the file, the mode is `pr`. With a malformed or unknown declaration, `git-flow` stops before any step that depends on it. [Workflow modes](plugins/git-flow/docs/workflow-modes.md) covers the optional `baseBranch` and `branchPrefix` settings.

`issues` reads board names, options, and issue types from [`issue-workflow.json`](plugins/issues/docs/configuration.md). Without a board, it uses plain issues.

Installing `codex` does not configure Codex. The [Codex setup guide](plugins/codex/docs/codex-setup.md) covers sign-in and settings.

Installing `gemini` or `grok` does not configure or install its CLI. Each needs Bash and `jq`. The [Gemini setup guide](plugins/gemini/docs/gemini-setup.md) covers Antigravity CLI sign-in. The [Grok setup guide](plugins/grok/docs/grok-setup.md) covers subscription sign-in. Both skills remove API-key overrides.

`web-qa` videos need `ffmpeg` and `ffprobe`. Figma review needs a Figma URL and the Figma MCP server.

## Safety

- Nothing is written to GitHub, files, or CI without your request and a preview of the content.
- Publishing an acceptance review needs fresh approval of the final version.
- Audit reports stay in the conversation unless you pick a file path.
- Tools are never installed without your request and a preview of the command.
- `codex` is read-only by default. `--write` turns off the filesystem sandbox.
- `gemini` and `grok` only cross-check public web research Claude has already done. They grant no repository access or write mode and never auto-approve tools. Temporary research files are removed after the run.
- `gemini` and `grok` run in read-only plan mode from an empty private directory. This is not an operating system sandbox, so review each CLI's own configuration.
- Never send secrets, credentials, private code, customer names, or personal data to research providers. Claude checks cited URLs before relying on provider output.
- SOC 2 readiness is a technical review, not an attestation.

## Hooks

`core` adds documentation guidance at session start, plus Next.js guidance when the project uses `next`. It can format files after each edit; start Claude Code with `CORE_FORMAT_AFTER_EDIT=1` to turn that on. See [core hooks](plugins/core/docs/hooks.md).

`git-flow` checks branch names, pushes to the base branch, and repository and pull request creation before they run. It blocks force pushes and admin merges to the base branch. See [git-flow hooks](plugins/git-flow/docs/hooks.md).

## More docs

- [Audit contract](plugins/audits/docs/assessment-contract.md) and [verification source](plugins/audits/docs/verification-source.md).
- [Browser workflow](plugins/web-qa/docs/browser-workflow.md), [design contract](plugins/web-qa/docs/design-contract.md), [video tools](plugins/web-qa/docs/video-tools.md), and [CI checks](plugins/web-qa/docs/ci-checks.md).
- [Agent guide](plugins/specialists/docs/README.md).
- [Git-flow safety](plugins/git-flow/docs/safety.md) and [eval scenarios](plugins/git-flow/evals/README.md).

Licensed under the [MIT License](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md) for local checks.
