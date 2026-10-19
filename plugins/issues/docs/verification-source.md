# Verification source

Use the intended current worktree. Confirm its repository, remote, and named comparison branch from repository guidance, configuration, and user scope. Do not substitute another checkout or cached evidence.

```sh
"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base> --remote <configured-name>
```

The remote defaults to `origin` only when no name is supplied. The branch must be explicit. A qualified `refs/heads/<branch>` is accepted. HEAD, tags, revision expressions, duplicate flags, and unknown flags are rejected.

Exit zero returns one JSON object with `status: ready`, `mode: current-worktree`, physical `root`, full `headOid`, committed `treeOid`, `dirty`, `remote`, `baseRef`, and freshly fetched full `baseOid`. The tree OID describes HEAD, not dirty filesystem content. Exit nonzero means no usable evidence. A dirty snapshot may support a current-worktree investigation, but cannot prove delivered or accepted code.

The helper fetches the named branch into a unique temporary local ref and deletes that ref in a finally block. It does not update configured tracking refs or trust FETCH_HEAD. It disables repository hooks and filesystem monitors for its Git commands. It rejects routing environment overrides, ambiguous fetch URLs, and source or remote changes during collection. Each Git command has a deadline. Failures do not reuse an old OID.

For Solved or acceptance evidence, require `dirty: false` and `headOid == baseOid`. Read source using the full immutable base OID. Check every linked merged PR's merge OID is an ancestor of that base. Inspect intervening changes where relevant. A PR marked merged is insufficient on its own. Recollect evidence after source drift and before publication. Keep the full tuple with the report.

This is a vendored copy of the small core verification runtime, with a plugin-local ref namespace. It reads no other installed plugin's files. It supplies source identity only. It does not verify requirements, actor independence, review completeness, deployments, or test results.
