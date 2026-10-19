---
name: create-branch
description: Create a contributor branch named prefix/short-description, or rename an automatically named local branch when explicitly requested.
---

Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md` and `${CLAUDE_PLUGIN_ROOT}/docs/workflow-modes.md`. This skill works in both modes. It does not create a PR or push.

1. Inspect the root, current branch, worktrees, local refs, remote refs and status. Refuse an in-progress Git operation. If the tree is dirty, report the affected paths and stop before switching; do not stash or commit automatically.
2. Resolve the contributor prefix from the mode helper's `branchPrefix`, or from the same documented fallback if the mode is absent: authenticated `gh` login, else slugged Git user name. Missing mode does not block local branch creation. Read-only discovery never selects a default workflow. Reject agent prefixes such as `claude/`, `codex/`, `gemini/`, `agent/`, `assistant/` and `worktree-` variants. Do not infer a contributor from a customer or organization.
3. Choose a short lowercase hyphenated description of the task. Form `<prefix>/<short-description>` and run `git check-ref-format --branch <name>`. Show the resolved name and starting commit. Default to the current HEAD unless the user or repository requests the delivery base. For a base start, fetch the exact named branch with `verification-source.ts` and use its full base OID. Failed fetch blocks that start; do not substitute a stale local ref.
4. Check both local branches and the selected remote for the exact name. If it exists, stop and report it rather than overwriting or silently switching. Check `git worktree list` so another worktree's branch is never moved.
5. Create with `git switch -c <name> <full-start-oid>`. If the user requested normalization of an automatically named current branch, use `git branch -m <name>` only after inspecting its commits, verifying ownership and checking that it has no PR or remote ref. A published or already canonical branch needs an explicit rename plan and authorization. No branch-normalization helper is needed.
6. Report the new name, starting OID, operation and clean status. Do not push or change remote refs.
