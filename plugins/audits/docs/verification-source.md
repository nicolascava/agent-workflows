# Source identity

Run from the target worktree. Identify its configured remote and base branch from
repository guidance and local configuration. Do not assume a branch name. Ask if
the intended base is ambiguous.

```sh
bun "${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <base-branch> --remote <configured-remote>
```

This helper is vendored from the marketplace's `core` plugin. Its only code change
is the temporary ref namespace. The copy makes this plugin self-contained. It
collects source identity without running repository checks. Bun and Git are required.

The helper fetches the named branch into a temporary ref and returns JSON with
`root`, `headOid`, `treeOid`, `baseOid`, `baseRef`, `remote`, and `dirty`.
Treat nonzero exit or missing `status: ready` as blocked source verification.
Never substitute an old tracking ref, `FETCH_HEAD`, another checkout, or a tag.
Keep remote credentials out of the report.

Source collection adds Git objects and briefly creates a private ref. It removes
that ref on completion. It disables repository hooks and file-system monitors.
It does not change the working tree, index, HEAD, tracking refs, or `FETCH_HEAD`.
This metadata operation is the audit's sole routine write exception. If fetching
is prohibited or unavailable, report that limit. Do not claim a fresh remote base.

## Bind the evidence

For a clean worktree, record the full HEAD and tree OIDs and the fetched base OID.
Inspect the named worktree only. For a dirty worktree, the HEAD tree is not the
subject. Record status and content hashes of the staged patch, unstaged patch,
and every scoped untracked file. Use Git with external diff and text conversion
disabled. Hash locally without publishing patch contents or secrets.
Record exclusions, including unreadable files and submodule state.

The helper checks HEAD, tree, status, and remote stability during its fetch.
It does not hash dirty file contents. A status list alone cannot detect edits
that keep the same status. Capture hashes before inspecting files and repeat
them before reporting. Also recheck HEAD, tree, and status. If they drift, repeat
the affected review or mark it partial. Do not attach earlier evidence to new code.

An explicitly requested committed snapshot may instead use a supplied full commit
OID. Verify that it resolves to a commit and read files from that commit. Record
the tree OID. Never label current working files as that snapshot. This mode does
not prove the remote branch is current. An explicit PR comparison needs full base
and head OIDs, not moving branch names. If the skill requires the helper, use it.

For external evidence, record the repository or file identifier, exact query,
time window, retrieval time, pagination coverage, and revision when available.
Do not invent an immutable revision for a tool that does not expose one.
