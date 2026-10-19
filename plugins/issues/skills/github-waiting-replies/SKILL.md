---
name: github-waiting-replies
description: "List open issues and PRs waiting for a person's reply or review."
argument-hint: '[repo=owner/repository[,owner/repository...]] [user=login]'
---
# Find waiting replies

This is read-only. Never post, assign, resolve threads, change status, or request reviews. Read `${CLAUDE_PLUGIN_ROOT}/docs/portable-instructions.md` and `${CLAUDE_PLUGIN_ROOT}/docs/runtime.md`.

Use the explicitly supplied repository list, otherwise the current repository from `gh repo view --json nameWithOwner`. Use the requested login, otherwise the authenticated login from `gh api user`. State that scope. Do not enumerate organizations or infer a repository list from another checkout.

Run `"${CLAUDE_PLUGIN_ROOT}/bin/github-waiting-replies.ts" --repo <comma-separated-owner/repository> --user <login>`. It reads every page of open issues and PRs, issue comments, review threads, and nested thread comments within its documented bounds. It checks that each candidate is still open before reporting it. Permission errors, malformed results, and pagination limits remain visible as incomplete scopes.

Keep every independent reason:

- A current individual review request for the person.
- A mention in the latest human issue comment from someone else.
- A decision or confirmation request in that comment on the person's own issue or PR.
- An unresolved review thread whose latest human comment is from someone else.

Ignore bots, deleted identities, minimized comments, quoted text, inline code, fenced code, resolved threads, and stale pings answered by the person. A team review request alone is outside the scanner's scope. Do not infer that every question is addressed to the person.

List urgent or explicitly blocking items first, then oldest outstanding signals, with deterministic repository and number ties. Include repository, number, title, reason or reasons, age when available, and direct comment/thread URLs. Preserve multiple reasons for one item. State whether the scan completed. Say no waiting items only when every requested scope completed. Partial results must carry the failed scopes and must not claim an all-clear.
