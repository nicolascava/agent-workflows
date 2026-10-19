# Target resolution

Accept a PR URL, `owner/repo#N`, or a bare number bound to the intended target repository. Resolve the exact repository and positive PR number before provider reads. A bare number without a verified repository is ambiguous. Confirm the selected current worktree and configured remote belong to that repository.

The coordinator reads exact PR metadata with `gh pr view <number> --repo <owner/repo> --json number,url,title,body,baseRefName,headRefOid,headRepository,headRepositoryOwner,isCrossRepository`. Validate the returned target and full head OID. Read linked scope only where authorized. Missing or contradictory metadata blocks review. A fork target does not authorize executing its code or accessing a different checkout.

Require the intended current worktree to have that exact HEAD and no staged, unstaged, or untracked changes. Otherwise report blocked; do not switch branches, reset, rebase, or create a worktree. Never silently include local changes in a PR review.

Invoke the installed verification helper with the PR's explicit current base branch and the verified base remote. Require ready evidence. Pin its fetched `baseOid`, the PR `headOid`, and the HEAD tree OID. Compute `git merge-base --all <baseOid> <headOid>` and require exactly one full commit OID. Missing history or multiple merge bases block the review.

The reviewer uses `git diff --no-ext-diff --no-textconv <mergeBaseOid> <headOid> --` and `git show <headOid>:<path>` for code reads. Never substitute a symbolic ref, another checkout, or a cached snapshot. A partial read cannot establish a repository-wide absence claim.

Before reporting, the coordinator re-reads the exact PR's head and base metadata, HEAD, tree, and clean status. If any binding changes, discard the verdict and report drift. A new review attempt must collect fresh evidence. The reviewer itself has no network access.
