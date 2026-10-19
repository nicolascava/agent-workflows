---
name: update-deps
description: "Update dependencies with typecheck and test gates, one package or a bounded batch."
argument-hint: "[package-name, or a batch limit that defaults to 5]"
---
# Dependency update workflow

Update outdated dependencies one at a time with typecheck and test gates.

The argument selects the scope. A package name updates just that package and skips listing unrelated packages. A positive number bounds the batch. No argument means a batch of 5. Major upgrades require explicit task authority.

Read `${CLAUDE_PLUGIN_ROOT}/docs/documentation-currency.md` and `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`. Confirm the intended current worktree and collect ready evidence with `"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base>`. A failed fetch or ambiguous source blocks edits.

1. **Preflight:** Read repository guidance only if present. Discover the package manager, lockfile policy, update command, and required checks from package metadata, lockfiles, a Makefile, and CI. Establish a green baseline. Inspect dependency directories for symlinks before installation. Never write through a symlink into another worktree. If found, stop and propose a local install; do not delete links or replace shared dependencies without authority. Preserve pre-existing edits.
2. **List:** Use the discovered package manager's outdated command. Present the bounded candidate list and note major versions outside scope.
3. **Update loop:** For the named package, or each dependency up to the limit:
   - Check current primary documentation and migration notes for the selected version.
   - Run the repository's update command for that one package and permitted version range.
   - Update only the lockfiles the repository requires. If several lockfiles exist and policy is unclear, stop rather than invoking another package manager by guesswork.
   - Run the discovered typecheck, tests, build, and lint gates where required. If a check fails, make only authorized compatibility fixes with `/core:tdd`, or revert only this update's changes and skip the package. Preserve unrelated edits.
   - Proceed to the next dependency only after the current one is green. Do not accept an incomplete required gate as green.
4. **Summarize:** Report old and new versions, skipped packages and reasons, commands and outcomes, and any incomplete checks. Do not commit, publish, or change external state unless the task authorizes it.
