# Acceptance publication

A review produces evidence first. Publication requires a separate, fresh approval of a concrete bundle at the end of the same run. An initial request to publish does not replace this checkpoint. Draft everything and complete the gates before asking for approval.

Before the preview, verify a known [workflow mode](workflow-modes.md), exact repository and issue identity, an open issue at configured acceptance, live board membership, field and option IDs, closed direct blockers, current assignees, authenticated independent actor, linked PR authorship, and the exact challenged packet. Read current comments and packet markers. A conflicting later packet or edited acceptance comment invalidates the attempt. Missing configuration, ambiguity, or drift blocks terminal publication.

Show one bundle containing the exact repository, issue number, current body/comment bindings, packet and comment digests, actor, current status, proposed status, issue state change, every comment body, and any requested assignment change. A Passed bundle applies these steps in order:

1. Publish the challenged result comment with its exact packet marker.
2. Move the live project item from configured acceptance to configured shipped.
3. Close the issue as completed.
4. Post the approved shipping comment stating what shipped, agreed cuts, and remaining limits.

A Failed bundle publishes the challenged result comment, then moves from configured acceptance to configured ready and keeps the issue open. Do not add closure or shipping comments. If already closed, return to preflight rather than silently reopening it.

Wait for the user's explicit approval after showing the bundle. Approval applies only to those exact steps and bytes. Recheck all live bindings immediately before the first write. A change requires a new preview and approval. Neither a plugin dependency nor a gate's zero exit authorizes publication.

After each write, read the actual state or comment back and compare. Stop on the first failure, uncertain response, or mismatch. Do not repeat a comment post after a timeout until its existence has been reconciled. Report completed, failed, and unattempted operations. Do not continue later steps to make the result look complete. Keep the evidence packet and source identities in the receipt. Mark partial publication Incomplete.

There is no external support synchronization or automatic assignment. Without a board, provide the read-only acceptance evidence report and explain that the configured terminal workflow is unavailable.
