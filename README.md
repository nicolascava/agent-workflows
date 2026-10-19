# agent-workflows

A free Claude Code plugin marketplace of engineering workflows.

This Phase 1 scaffold contains manifests and empty component directories.
No workflows have been migrated yet.

| Plugin | Purpose | Status |
| --- | --- | --- |
| `core` | Test-driven development, code review, and dependency updates. | coming soon |
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
That command will become available when the skill ships.

Licensed under the [MIT License](LICENSE).
See [CONTRIBUTING.md](CONTRIBUTING.md) for local checks.
