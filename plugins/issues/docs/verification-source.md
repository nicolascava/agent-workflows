# Verification source

Code-dependent decisions need current, attributable evidence. This plugin supports the intended current worktree, including uncommitted changes, with a freshly fetched immutable remote comparison OID. It does not create other checkouts or provide remote execution, snapshot caches, or background jobs.

Each plugin carries a self-contained copy of this contract and its source-identity helper, with a plugin-local temporary ref namespace. No other installed plugin is required. The helper establishes source identity, not requirements, actor independence, review completeness, deployments, or test results. Bun and Git are required.

## Read-only assessments

For a default read-only assessment, resolve the requested revision, or current HEAD, to a full commit OID and verify it is a commit. Record its tree OID and read files from those objects. State that this is a committed snapshot. Local edits are excluded; mark the result partial if they belong to the requested subject. This mode does not establish remote freshness or verify live working files.

Use current-worktree collection below only when the task authorizes its fetch. An audit request alone does not authorize Git metadata writes. Show the exact command, target worktree, configured remote, base branch, and plugin-local temporary ref namespace before fetching for an assessment. If fetching is prohibited or unavailable, use a committed snapshot or report blocked when live evidence is required. Never claim a fresh remote base without collecting it.

## Establish trust and the target

Start from the worktree the user selected. Confirm its physical root and configured remote match the intended repository. Read repository guidance only if present. Do not search for another checkout when evidence is unavailable. A path or remote name is a locator, not proof that it is the intended source.

Resolve the comparison branch from the explicit request or the exact PR's current base metadata. Otherwise use committed repository guidance or a verified remote default branch from `git ls-remote --symref <remote> HEAD`. Stop if the repository, remote, PR association, or base choice is ambiguous. Never guess a default branch or infer one from a stale tracking ref. Detached HEAD is valid when the intended subject and base are explicit.

## Collect current-worktree evidence

From the intended worktree, invoke the installed helper. In skill Markdown, the host substitutes the plugin-root placeholder before use:

```sh
"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <branch> --remote <configured-name>
```

`--base` is required. It accepts a short branch name or `refs/heads/<branch>`. `--remote` defaults to `origin`; it must name a configured remote with one fetch URL. It never accepts an arbitrary repository URL. The caller must verify that URL belongs to the intended repository before invoking the helper.

HEAD, tags, revision expressions, duplicate flags, and unknown flags are rejected.

Require exit 0 and one JSON object with `status: "ready"`, `mode: "current-worktree"`, physical `root`, full `headOid`, `treeOid`, `baseOid`, `dirty`, `remote`, and `baseRef`. Require the root and subject OID to match the intended target. Failure or malformed output blocks code-dependent claims and production edits. Never continue with an earlier successful result.

The helper fetches the fully qualified remote branch into a unique temporary ref, verifies that its full OID names a commit, and deletes the ref before returning. It does not trust `FETCH_HEAD`, a symbolic ref, or a tracking-ref cache. Fetch failure is a blocker even when old objects exist locally. It rejects repository-routing environment overrides and detects HEAD or status drift during collection. It disables repository hooks, file-system monitors, optional index refreshes, and automatic fetch maintenance. It does not switch branches, rebase, install dependencies, run project code, or change source files. Fetching does write Git objects; this is the only lasting repository change it needs.

Each Git command has a deadline. Source collection leaves the worktree, index, HEAD, tracking refs, and `FETCH_HEAD` unchanged. Keep remote credentials out of reports.

Use `baseOid`, never the branch name, in later reads and comparisons. `git diff <baseOid> --` compares the live tracked subject; also inspect staged changes with `git diff --cached` and untracked files where in scope. A dirty worktree is valid active-work evidence. It is never clean default-branch evidence. The helper's dirty flag is not a complete snapshot digest or an approval.

## Pull-request and review evidence

Resolve the exact repository and PR through read-only metadata. Require a full immutable PR head OID and current base branch. Require the selected current worktree's HEAD to equal that head and its index and worktree to be clean for a PR review. Otherwise report blocked; do not check out the PR in a different clone or silently review local edits as PR content.

Fetch the confirmed base through the helper. Compute `git merge-base --all <baseOid> <headOid>` and require exactly one full commit OID. Read committed code with `git show <headOid>:<path>` and compare `git diff <mergeBaseOid> <headOid> --`. Never replace those OIDs with a branch name in later reads. Missing objects, shallow history that prevents a merge base, multiple merge bases, or a changed PR head block the review.

For uncommitted work, record HEAD, tree, status, both staged and working-tree patch hashes, and hashes of in-scope untracked files before review. Use `git diff --no-ext-diff --no-textconv --binary HEAD -- | git hash-object --stdin`, the corresponding cached diff hash, and `git hash-object -- <path>` for named untracked files. Recheck the same evidence before reporting. Include untracked file contents in the review; a tracked diff alone is incomplete. Any drift invalidates the verdict and requires a fresh review. Store any requested report outside the subject worktree.

The helper checks status stability but does not hash dirty file contents. The tree OID describes HEAD, not dirty filesystem content. A status list cannot detect edits that keep the same status. Record exclusions, including unreadable files and submodule state. Hash locally without publishing patches or secrets. Never label live working files as a committed snapshot.

## Solved and acceptance evidence

For Solved or acceptance evidence, require `dirty: false` and `headOid == baseOid`. Read source using the full immutable base OID. Check every linked merged PR's merge OID is an ancestor of that base. Inspect intervening changes where relevant. A PR marked merged is insufficient on its own. Recollect evidence after source drift and before publication. Keep the full source tuple with the report. Dirty current-worktree evidence cannot prove delivered or accepted code.

## External evidence

Record the repository or file identifier, exact query, time window, retrieval time, pagination coverage, and revision when available. Do not invent an immutable revision for a tool that does not expose one.

## Execution and fail-closed reporting

Discover verification commands from the target repository's scripts, lockfiles, Makefile, and CI configuration. Run only trusted commands within the authorized scope. Running tests can execute repository code. A read-only review must not execute reviewed code. Installation, lifecycle scripts, network side effects, or writes outside approved build artifacts need separate task authority.

Record the command, source identity, exit status, and bounded error evidence for each check. A missing required command or unavailable evidence is blocked or incomplete, never passed. Do not downgrade executable checks to inspection and claim success. Metadata-only claims must state that code was not consulted and must not infer behavior, absence, tests, or configuration from metadata.

Recollect evidence when the subject or comparison target changes. No cached verdict, successful fetch, or immutable OID from a previous run proves that today's requested target is current. An absence claim requires a complete search of the relevant pinned scope; a partial file read cannot prove absence.
