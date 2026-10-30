# Coordination parents

A coordination parent has no parent and only direct deliverable children. Children have no children and no other parent. Native GitHub sub-issue links are the hierarchy. A checklist does not establish membership. Child order is presentation, not a dependency graph.

Use this generic body when creating a parent. Fill every section with facts. Do not publish angle-bracket placeholders.

```markdown
## Problem

<The shared outcome and why it needs coordinated deliverables.>

## Constraints

<The boundaries shared by the children and the completion criteria.>

## No-gos

<What this coordination effort excludes.>

## Sources

<Links supporting scope and decisions.>
```

Keep child-specific implementation requirements in children. Configure a native project type when available; otherwise a plain issue can coordinate the same links. A board is optional for hierarchy, and required for field rollups or placement.

Preflight every node before any attach. Refuse self-links, duplicate child requests, nesting, and replacement of another parent. Native attach payloads set `replaceParent: false` so a changed parent cannot be silently replaced between reads. Apply requests in order and confirm each with fresh readback. A failed response stops later writes.

Reorder accepts exactly the live member set. To move a new head, put it before the current head. Subsequent moved nodes use the desired previous child as an after anchor. Every payload has exactly one anchor. A missing member or changed order invalidates the plan.

For a field sync, capture direct children in native order, live project fields, and one complete board snapshot for the operation. Bind the packet to parent and project IDs. Do not persist or reuse it across operations. Roll up priority, impact, and effort from the highest configured rank present in children. Clear only when there are no populated values and the clear was previewed. Unknown values block the rollup.

Building, review, or acceptance in any child may move a parent to configured building. With no active child, leave parent status unchanged. Never infer shipped, ready, closed, or completed from child values. Sync edits the parent only. Preflight every field and option before writing. Missing configuration preserves hierarchy and reports unavailable board operations.

The shipped parent CLI previews hierarchy only. Field sync and placement remain explicit skill procedures using live `gh` reads and previewed provider payloads. There is no automatic scheduler or retry loop.
