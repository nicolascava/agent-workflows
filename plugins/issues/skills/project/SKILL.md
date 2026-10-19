---
name: project
description: "Manage a one-level issue hierarchy and preview parent field rollups."
argument-hint: '<create|convert|attach|detach|reorder|sync|sync-parent-for-child|show|place> <issue> [children...]'
---
# Coordinate a parent issue

Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md`, `${CLAUDE_PLUGIN_ROOT}/docs/configuration.md`, and `${CLAUDE_PLUGIN_ROOT}/docs/parent-projects.md`. Show is read-only. Creation, conversion, attachment, detachment, ordering, placement, field sync, and assignment require the user's request and an exact payload preview. Never infer authority to change children from authority to change a parent.

A parent coordinates direct deliverable children. It is not a hidden implementation task. Use a configured native project type only if available. A missing native type or board permits a plain coordination issue with an explicit limitation.

1. Resolve repository and issue identities. Read the parent, its parent, every direct child, and their direct child counts fresh. Verify pagination completed. A parent must have no parent. A child must have no children and no other parent. Refuse self-links, duplicates, nesting, and silent reparenting. Do these checks for every requested child before the first write.
2. For create or convert, draft the generic parent body from `${CLAUDE_PLUGIN_ROOT}/docs/parent-projects.md`. Preview title, body, type, child links, and board fields. Preserve existing contracts unless conversion was requested. Create with the ordinary issue flow. Do not close children or infer delivery from the parent.
3. For attach, detach, reorder, or show, write a JSON request with `operation`, `parentId`, and `childIds` when needed. Run `"${CLAUDE_PLUGIN_ROOT}/bin/parent-project.ts" --input <request>`. The helper only reads and prints a plan. Attach skips existing members. Detach skips nonmembers. Reorder requires the exact current member set. It uses a before anchor for a new head and after anchors for later positions.
4. Show the ordered GraphQL payloads and all old/new values. Refresh hierarchy immediately before applying. Send only the approved payloads, in order, with `gh api graphql --input <payload-file>`. Attach uses `replaceParent: false`. Read membership and order back after each write. Stop on the first error or drift. Report completed, failed, and unattempted operations. Do not retry or roll back automatically.

For sync, capture one fresh ordered child list and one board snapshot for this operation. Bind both to the exact parent and project IDs. Roll up priority, impact, and effort to the highest present configured rank. Empty child values clear the parent field only when that clear was previewed. Unknown ranks block sync. If any child is building, in review, or in acceptance, propose the configured building status for the parent. Otherwise leave status unchanged. Do not infer ready, shipped, or closed from rollups.

Resolve every target field and option before the first sync write. Preview the complete parent-only field plan, then apply and read back only with user authority. `sync-parent-for-child` first resolves the child's current parent and performs that same parent sync. It never searches unrelated repositories. `place` requires an explicit board and anchor; preview membership and ordering separately. Missing board configuration leaves the hierarchy intact and reports unavailable placement.

If the git-flow plugin is installed, delivery may use `/git-flow:pr` or `/git-flow:land` under its own mode and approval gates. This skill grants no delivery authority.
