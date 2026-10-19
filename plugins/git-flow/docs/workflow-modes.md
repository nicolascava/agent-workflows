# Workflow modes

The target repository declares its delivery mode in `git-workflow.json` at the repository root. Commit this file as repository policy. Do not infer the mode from branch names, hosting settings or an earlier checkout.

```json
{ "workflow": "pr" }
```

```json
{ "workflow": "solo-shaped-kanban" }
```

| Skill | `pr` | `solo-shaped-kanban` |
| --- | --- | --- |
| `commit`, `create-branch`, `rebase`, `resolve-conflicts` | Available | Available |
| `pr`, `update-pr`, `apply-pr-feedback`, `execute-test-plan`, `merge` | Available | Refuse; use `land` for delivery |
| `land` | Refuse; use `pr` and `merge` | Review, squash to one commit, push to base |

Missing, malformed or unknown declarations allow read-only inspection. Stop before any mode-dependent mutation. Say: `Create git-workflow.json at the repository root with {"workflow":"pr"} or {"workflow":"solo-shaped-kanban"}.` Never create the declaration just to unblock delivery. Local commits and branch operations work in both modes, but pushes to the base always require the landing or merge workflow.

Two optional fields are supported. No other fields are accepted.

| Field | Use | Default |
| --- | --- | --- |
| `baseBranch` | Base branch name for new work and delivery | The selected remote's live default branch, read with `git ls-remote --symref <remote> HEAD` |
| `branchPrefix` | Contributor prefix in `<prefix>/<short-description>` | The authenticated `gh` login, else a lowercase slug of `git config user.name` |

`baseBranch` is a branch name, not an OID, tag or revision expression. `branchPrefix` uses lowercase letters, digits and single hyphens. Agent prefixes, including `claude`, `codex`, `gemini`, `agent`, `assistant` and `worktree`, are rejected, including variants with a hyphen suffix. A feature branch's full name must also pass `git check-ref-format --branch`. Do not treat this naming rule as proof of authorship.

Run the installed helper from the target worktree:

```bash
bun "${CLAUDE_PLUGIN_ROOT}/bin/workflow-mode.ts" --remote origin
```

Select and confirm the remote first. `origin` is the helper's default remote name, not proof of its destination. Success prints one JSON object with `root`, `workflow`, `baseBranch`, `branchPrefix` and `remote`. This `workflow` field is separate from the verification helper's `mode`, which describes an evidence source. Failure prints no JSON and exits nonzero. A declaration must be a regular file below 64 KiB. A failed remote lookup never falls back to a cached default branch. The helper does not change the worktree or GitHub.

A Bun helper keeps validation, root resolution, live default discovery and prefix fallback identical across ten skills. A short `jq` expression would validate only the JSON and leave these safety decisions duplicated in each skill. Commands have time bounds and do not run through a shell.
