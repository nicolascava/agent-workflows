# Workflow modes

Read the target repository's root `git-workflow.json` when a step depends on delivery policy. The recognized declarations match the optional git-flow plugin:

```json
{ "workflow": "pr" }
```

```json
{ "workflow": "solo-shaped-kanban" }
```

| Operation | Missing or unknown mode | pr | solo-shaped-kanban |
| --- | --- | --- | --- |
| Read issues, scan replies, draft or review evidence | Available | Available | Available |
| Requested issue creation, body edits, classification, hierarchy | Available with payload preview | Same | Same |
| Requested intake, ready, or active board edits | Available with configured fields and gates | Same | Same |
| Acceptance publication, shipped transition, delivery closure | Blocked | Acceptance gates required | Acceptance gates required |
| Git delivery | No authority from issues | Optional `/git-flow:pr` | Optional `/git-flow:land` |

Unknown declarations must be reported, not treated as a default. The small `lib/workflow-mode.ts` parser returns no mode for an absent declaration and rejects unsupported names. Before terminal changes, read the file afresh and require one of the recognized modes. A mode declaration never grants mutation authority.

Both recognized modes use clean current-worktree evidence at the fetched delivery base for status and acceptance claims. An open PR head is not delivery evidence. Read [verification source](verification-source.md). If the git-flow plugin is installed, its own skills enforce Git delivery rules and approvals. This plugin does not read its files.
