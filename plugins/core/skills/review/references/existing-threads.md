# Existing threads

The coordinator fetches review threads after pinning the PR head and before retaining findings. Use a read-only provider query with explicit repository and PR variables. Request only thread state, path, line, and comment text needed to compare feedback. Paginate through the relevant threads; transport failure or partial pagination is incomplete evidence, not an empty result. Pass the fetched evidence to the isolated reviewer without credentials.

Do not repeat feedback that is already present, acknowledged, resolved, or clearly waiting on the author. A previously resolved issue is eligible again only with evidence that the current change reintroduced it.

For each retained candidate, use a changed-file anchor from the pinned diff. Verify its path, side, and line range at the pinned head. A stale or invalid anchor blocks that candidate; do not turn it into a general external comment.

Deduplicate by affected behavior, not wording. Keep the clearest single comment when two candidates describe the same fix. Preserve severity and evidence in local metadata, outside the proposed visible body. No thread is posted, replied to, or resolved by this skill.
