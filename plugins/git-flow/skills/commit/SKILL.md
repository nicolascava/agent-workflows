---
name: commit
description: Commit and push the authorized changes on the current feature branch. Use for a checkpoint or quick save, including a commit within a larger task.
---

Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md` and `${CLAUDE_PLUGIN_ROOT}/docs/workflow-modes.md`. This skill works in both modes. A local commit does not grant permission to push the base.

1. Inspect the current physical worktree, branch, staged and unstaged diffs, and every untracked path. Refuse detached HEAD and the delivery base. Resolve the live remote default if needed without guessing a workflow mode. If the base cannot be identified, report the uncertainty and stop before pushing. Do not commit during an unresolved Git operation.
2. Identify the user's authorized change scope. A quick-save request covers the pending task changes, not unrelated edits or secrets. Inspect sensitive or generated files before staging. Stop for a decision when ownership or inclusion is unclear. If the tree is unchanged, report that and return to the parent task.
3. Stage the selected paths with explicit arguments. Use `git add -A` only when every pending path was inspected and is within scope. Inspect `git diff --cached` after staging. Do not use a commit as a substitute for required task verification. If verification is needed, run `/core:verify`; this requires the `core` dependency.
4. Write an imperative subject in sentence case, at most 72 characters, without a trailing period, Conventional Commits prefix or assistant attribution. Explain why in an optional body. Keep issue references non-closing unless the user explicitly asked to close. Write the message to a temporary file and use `git commit -F <message-file>`. Keep hooks enabled. Inspect the resulting commit.
5. For this skill's requested feature-branch push, confirm the destination and branch ownership. If the branch has an existing PR, apply the author and exact-operation gate in the safety doc first. Recheck the branch and remote. Use a normal push with an explicit feature ref, such as `git push -u <remote> HEAD:refs/heads/<feature-branch>`. Never push to the base, force, or bypass a hook. A rejected push is blocked; use the authorized rebase workflow if appropriate.
6. Report the branch, full commit OID, included scope, checks and push result. A commit can succeed while the push fails; state both. If this was a checkpoint within a larger task, continue that task after the report.
