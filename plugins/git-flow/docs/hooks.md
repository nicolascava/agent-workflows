# Git-flow hooks

Registrations use quoted `${CLAUDE_PLUGIN_ROOT}` paths in `hooks/hooks.json`.
The guards use the declaration reader exported by `bin/workflow-mode.ts`.
They never discover identity or contact a remote. The mode helper's CLI still can.
Each guarded call must resolve a physical Git worktree. Invalid declarations,
repository-routing overrides and dynamic guarded arguments deny the call.
Unrelated tools and commands emit no decision. An empty result leaves normal permissions in place.

A repository without `git-workflow.json` is treated as `pr`.

| Operation | `pr` | `solo-shaped-kanban` |
| --- | --- | --- |
| Agent-prefixed branch creation | deny | deny |
| Contributor branch, matching a declared prefix | allow | allow |
| Wrong declared branch prefix or slug | deny | deny |
| Repository creation | ask | ask |
| PR creation | allow | deny |
| Issue creation | allow | allow |
| Admin merge override | deny | deny |
| Force or mirror push touching the base | deny | deny |
| Direct base push | deny | allow |
| Raw PR review or review-comment write | deny | deny |
| Explicit feature push or ordinary PR mutation | allow | allow |

Without a declared `branchPrefix`, there is no prefix gate.

Allow means the hook emits no decision. Other permissions and skill gates still apply.
If you run your own repository-creation guard, set
`AGENT_WORKFLOWS_ALLOW_REPO_CREATE=1` in the environment launching Claude Code to
skip this hook's repository-creation confirmation for CLI, API and MCP calls.
Only the exact value `1` opts out. Other values retain `ask`. Repository validation,
PR mode checks and all other guard decisions still apply.
Raw review writes cover `gh pr review`, non-GET `gh api` calls to PR review and
review-comment endpoints, review GraphQL mutations and GitHub MCP review tools.
Post reviews through a guard that checks the exact payload; its own `gh` calls run
outside the tool call and are not inspected. If you run such a guard, set
`AGENT_WORKFLOWS_ALLOW_RAW_REVIEW=1` in the environment launching Claude Code to
skip this check. Only the exact value `1` opts out.
Issues have no separate public policy setting. Unknown declaration fields are rejected.
A malformed declaration or unresolved guarded root denies even a creation that normally asks.
Base checks use declared `baseBranch`, then the local `origin/HEAD` symbolic ref.
An unresolved base blocks ambiguous pushes. An explicit destination with a contributor
path can proceed when there is no known base. Use the declaration for reliable checks.
PR authorship and remote repository binding remain skill responsibilities.
These hooks inspect common shell commands and GitHub MCP creation names. They do not
claim to sandbox arbitrary programs, aliases or scripts that run Git internally.

## Runtime

The plugin carries its own small runtime: bounded stdin, physical path checks,
JSON decisions, bounded child processes, Git environment cleanup and a shell guard shim.
It is copied or adapted from core. No installed hook imports a sibling plugin.
Input has one two-second deadline and a 1 MiB limit. Policy children have a
two-second deadline. Local Git probes have an 800 ms deadline, except the shared
declaration parser's ref validation, which stays within the policy deadline. Child process
groups are killed on completion or timeout, and captured output is limited to 1 MiB.
Missing Bun, invalid UTF-8 or a missing guard policy denies the call.
Advisories stay silent on errors.

The [plugin reference](https://code.claude.com/docs/en/plugins-reference#environment-variables)
defines `CLAUDE_PLUGIN_ROOT` as the current installed plugin's root.
The [dependency guide](https://code.claude.com/docs/en/plugins/dependencies) covers installation
dependencies. Neither supplies a shared runtime import in this implementation.
Keeping the small copies synchronized is an open maintenance question.

## Worktrees

At session start, the budget counts all registered worktrees, including the primary checkout
and stale registrations. The default is 20. A warning appears only when the count exceeds it.
`GIT_FLOW_WORKTREE_BUDGET=0` disables the advisory. A positive integer changes the threshold.
Invalid values use 20. The advice points to `git worktree list` and `git worktree prune`.
Nothing is removed.

Repair runs at session start and after `EnterWorktree`. It only maps an absolute local
`core.hooksPath` inside the primary checkout to the same existing directory in a linked checkout.
This can restore an already present Husky or other hooks directory. It requires
`extensions.worktreeConfig=true` to be set already. It never enables that extension,
changes the primary config, overrides a worktree path, installs dependencies or runs setup scripts.
Relative paths already resolve in each checkout. Global paths, external paths and bare layouts
are left alone. A missing mapped directory gets advice to use the repository's documented setup.
Config-only Husky or lefthook setups are left to that setup, since no generic safe install command exists.

## Migration choices

| Item | Removed or changed |
| --- | --- |
| Branch guard | Removed fixed contributor identity, private launch and the old push-prefix gate. Creation uses declared prefixes. |
| GitHub creation guard | Removed approval tokens and private issue routing. Repository creation asks, and PR creation follows the mode. |
| PR mutation guard | Removed network authorship checks and approval tokens. Skills retain authorship and exact mutation authority checks. |
| Worktree repair | Removed dependency installation and private worktree setup. Only an existing repository hooks path can be rebound. |
| Worktree budget | Replaced private thresholds and cleanup instructions with one public variable and Git commands. |
| Shared prose checks | Dropped unused prose classifiers and word lists. Adding their rejections would change the PR copy helper's tested contract. |
| Issue policy | Dropped private issue routing. Generic issue creation remains allowed. |
| Evals | Replaced identity, repository and path fixtures. Moved self-authored review to core. Dropped the development-link scenario with its private issue policy. |

The six git-flow scenarios and one core scenario are unscored. Structural tests verify prompt,
grader and skill references. Model behavior still needs manual or CLI eval runs.
