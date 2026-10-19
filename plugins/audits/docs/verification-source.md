# Source identity

For the default read-only assessment, resolve the requested revision, or current
HEAD, to a full commit OID and verify it is a commit. Record its tree OID and read
files from those objects. State that this is a committed snapshot. Local edits
are excluded; mark the result partial if they belong to the requested subject.
This mode does not establish remote freshness or verify live working files.

For current-worktree verification, use the helper below only when the user has
requested its fetch. An audit request alone does not authorize Git metadata
writes. Show the exact command, target worktree, configured remote, base branch,
and temporary ref namespace before running it. If fetching is not requested,
use the committed snapshot or report blocked when live evidence is required.
Identify the remote and base from repository guidance and local configuration.
Do not assume a branch name. Ask if the intended base is ambiguous.

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

Source collection adds Git objects and briefly creates a
`refs/audits-verification/<unique-id>` ref. It removes that ref on completion.
It disables repository hooks and file-system monitors.
It does not change the working tree, index, HEAD, tracking refs, or `FETCH_HEAD`.
If fetching is prohibited or unavailable, report that limit. Do not claim a
fresh remote base.

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

Never label current working files as a committed snapshot. An explicit PR
comparison needs full base and head OIDs, not moving branch names.

For external evidence, record the repository or file identifier, exact query,
time window, retrieval time, pagination coverage, and revision when available.
Do not invent an immutable revision for a tool that does not expose one.
