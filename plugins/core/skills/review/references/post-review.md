# Report a review

This file retains the review workflow's output boundary. The gate is read-only. Do not create a pending review, post a comment, submit an approval, request changes, commit, rebase, or land.

Before returning, verify the pinned head and base binding, worktree evidence, thread-read completeness, anchors, duplicate suppression, and candidate-validation results. Evidence drift or an incomplete required check blocks approval.

Return a local report with disposition, target, full base/head/tree OIDs, merge-base OID for PRs or live patch evidence for task work, reviewer identity, checked scope, findings, and unresolved evidence. Keep critical/major blockers separate from minor/nitpick follow-ups. A clean review says which evidence was reviewed and that no blockers were found in that scope.

If a caller requests JSON, return those fields as a single object. Do not persist a report unless the task requests it; place requested scratch artifacts outside the reviewed worktree. Do not persist a reusable approval cache.

Posting or delivery belongs to a separately authorized workflow. If the `git-flow` plugin is installed, its delivery workflow may consume these findings under its own authorization and fresh-evidence checks. This skill works alone and never invokes that plugin automatically.
