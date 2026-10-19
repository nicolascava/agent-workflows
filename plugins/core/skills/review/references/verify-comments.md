# Candidate validation

The reviewer reads pinned evidence and returns candidates. The coordinator validates that candidate set with plain read-only commands. No target-provided validator or private runtime is required. Do not execute code from the reviewed checkout. This is one validation pass, not another review or a receipt ceremony.

For each candidate:

1. Require `path`, line range or diff position, severity, body, and supporting evidence. Severity is critical, major, minor, or nitpick. Reject missing fields or unverifiable claims.
2. Check changed paths with `git diff --name-status <mergeBaseOid> <headOid> --`. Inspect anchors with `git diff --no-ext-diff --no-textconv --unified=3 <mergeBaseOid> <headOid> -- <path>`. Inspect exact content with `git show <headOid>:<path>`. For task work, compare the pinned `baseOid` and recorded live patch instead, including the index and named untracked files.
3. Validate the hunk side and line range against actual diff headers. Deleted lines use the base side. A line number in an unchanged file is not an inline changed-file anchor. Missing or ambiguous anchors block that candidate.
4. Confirm a reachable failure scenario and a specific requested change. Check callers, tests, and contracts only as needed. Critical/major claims need concrete supporting evidence. Do not elevate preferences into blockers.
5. Compare against fetched threads and the rest of the set by behavior. Remove duplicates and already-addressed items.
6. Count the prose with `wc -w` from the proposed body text, excluding only a fenced code suggestion. Require at most 35 words. Inspect punctuation and abbreviations to confirm at most two sentences. Check code-token formatting and practical effect. A suggestion must be a safe exact local replacement at the verified anchor.

Return accepted candidates and rejected candidates with reasons. If validation changes a candidate, revalidate only that changed set. Never rerun a whole-diff analysis or delegate a second reviewer to repair the artifact. Recheck source bindings before returning the verdict.
