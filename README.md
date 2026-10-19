# agent-workflows

A free Claude Code plugin marketplace of engineering workflows.

The `core` plugin provides engineering skills and verification support.
Other plugins are coming soon.

| Plugin | Purpose | Status |
| --- | --- | --- |
| `core` | Test-driven development, code review, and dependency updates. | available |
| `git-flow` | Branches, worktrees, and authorized change delivery. | coming soon |
| `issues` | Issue planning, creation, and repository-bound tracking. | coming soon |
| `audits` | Read-only engineering audits with scoped evidence and findings. | coming soon |
| `web-qa` | Interface design, visual review, and web quality assurance. | coming soon |
| `codex` | Opt-in Codex CLI integration. | coming soon |
| `specialists` | Specialist agents for engineering advice and review. | coming soon |

After publication, run these commands in Claude Code:

```text
/plugin marketplace add nicolascava/agent-workflows
/plugin install core@agent-workflows
```

Requirements: Claude Code, git, gh, bun, and jq.
The `codex` plugin also requires the Codex CLI.

Plugin skills use namespaced commands, such as `/core:tdd`.
Core skills: `tdd`, `debug`, `condense`, `verify`, `review`,
`adversarial-review`, `skill-review`, `context-diet`, and `update-deps`.

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

Licensed under the [MIT License](LICENSE).
See [CONTRIBUTING.md](CONTRIBUTING.md) for local checks.
