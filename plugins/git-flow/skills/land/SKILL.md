---
name: land
description: Squash a reviewed branch onto the delivery base and push in solo-shaped-kanban mode, only after a current-conversation request following diff presentation.
---

Requires `core` for `/core:verify` and a fresh `/core:review`. Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md`, `${CLAUDE_PLUGIN_ROOT}/docs/workflow-modes.md` and `${CLAUDE_SKILL_DIR}/../../docs/landing.md` before proceeding.

Run read-only inspection even if mode resolution fails. In `pr` mode, refuse landing and point to `/git-flow:pr` and `/git-flow:merge`. With a missing or unknown declaration, stop before any base push and show the setup message from the mode doc. Proceed only in `solo-shaped-kanban`.

Follow the landing procedure in full. Its gates are mandatory:

- Clean feature branch owned by the contributor or covered by exact authority. No detached HEAD, base checkout or in-progress Git operation.
- Live fetched immutable base OID, exact HEAD/tree OIDs and verified remote destination. The base must be an ancestor of HEAD before the squash. A nonempty reviewed tree diff is required.
- Verification against that source and a diff presented for review. The user must explicitly ask to land in this conversation after that presentation. Earlier generic delivery instructions and a review verdict do not satisfy this ask.
- A fresh independent `/core:review` with no blocking findings against exactly that HEAD, tree and fetched base OID. Missing reviewer, evidence or delegation blocks landing. Do not turn an old cached report into a fresh attestation.
- A single candidate commit whose sole parent is the fetched base and whose tree equals the reviewed tree. Validate its parent, tree, message and count before pushing.
- Final mode, destination, clean-tree and OID comparisons. A changed base or HEAD stops the run and requires new verification and review. Push without force and keep pre-push gates enabled. Confirm the resulting live base equals the squash OID.

Do not delete the source branch, move another checkout, deploy or start workers. Report the author, explicit-ask evidence, review attestation, verification commands and results, base/HEAD/tree/candidate OIDs, push and readback. If the repository documents a post-land command, mention it for the user without running it.
