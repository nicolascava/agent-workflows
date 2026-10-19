# Acceptance evidence

Start with a scope ledger of authorized issue requirements and later decisions. Keep additions, removals, replacements, constraints, and disputed decisions separate. Resolve contradictions before publication. Map each required outcome, constraint, no-go, and scenario to a stable criterion ID.

Use explicit issue scenarios first, then the linked merged PR's Test plan, then derive one to five scenarios. An empty checklist is not proof. Record every source and evidence gap. The linked PR must belong to the confirmed repository and its merge OID must be an ancestor of the fetched delivery base.

| Evidence | Meaning |
| --- | --- |
| observed | Direct behavior observed at the exact deployed or local delivery commit. |
| traced | A complete source trace at the pinned delivery base supports the claim. |
| reported | Another person's statement, screenshot, or unbound execution report. |
| unverified | Missing, inaccessible, stale, or insufficient evidence. |

Outcomes and constraints use Passed, Failed, N/A, or Unverified. No-gos use Held, Violated, N/A, or Unverified. Conclusive results require observed or traced evidence, a detail describing the proof, and `sourceOid` equal to the full fetched base OID. N/A also requires positive proof of inapplicability. Builder reports cannot establish Held or Passed. No-go proof must cover the prohibited behavior; the absence of a matching filename in one diff is not enough.

A trace may prove behavior without executing code. A UI observation needs an exact deployed SHA matching the accepted source. For an unchanged-path proof, retain the complete PR path set, intervening changes through the delivery base, and immutable current blob identities. Incomplete coverage remains Unverified. Do not run builds, tests, lint, CI, or services as part of acceptance review.

## Packet format

Serialize one UTF-8 JSON file once and preserve its exact bytes. The packet has:

| Key | Required contents |
| --- | --- |
| schema | `1` |
| repository, issue | Confirmed owner/repository and positive issue number. |
| session | Unique identity for this attempt. |
| conclusion | Passed or Failed. |
| source | Full ready current-worktree evidence, clean, with head equal to fetched base. |
| mergedPullRequests | Nonempty array of `{number, mergeOid, ancestorVerified: true, authors: [...]}`. Authors includes PR authors and commit authors and committers. |
| assignees, actor | Current assignee logins and the authenticated posting login. Actor is excluded from assignees and every PR author set. |
| criteria | Nonempty array of `{id, kind, result, evidence, sourceOid, detail}`. Kind is outcome, constraint, or no-go. IDs are unique. |
| findings | Array of `{criterionId, severity, ...}` linked to Failed or Violated criteria. Severity is critical, major, or minor. |

Retain scope ledger, scenario mapping, immutable citations, changed-path evidence, observations, and gaps as additional packet fields. This is a consistency schema, not an authorization token. The coordinator verifies each assertion against source and live provider reads. No local boolean can prove ancestry, identity, or independent review on its own.

Critical or major findings yield Failed. Otherwise use Passed, while stating all minor findings and unverified criteria. If everything is Unverified, stop as Incomplete. A transport, source, or processing failure is also Incomplete. Do not disguise either as Failed acceptance evidence.

Start the comment with the exact conclusion. Include a concise scope result, criterion evidence, findings, cuts, and gaps. Embed exactly one marker with the SHA-256 of the exact packet bytes and those bytes encoded as unpadded base64url:

```text
<!-- issues-acceptance:<packet-sha256>:<base64url-packet-bytes> -->
```

Ask one fresh independent reviewer through `/core:adversarial-review` to examine that exact packet and comment. Require a distinct reviewer, a converged approval, and no unresolved objections. The coordinator translates a verified approval into a challenge JSON containing `packetDigest`, `commentDigest`, `session`, `independent: true`, `completed: true`, `agrees: true`, and `objections: []`. Record reviewer identity and its verdict with the evidence. Never synthesize a completed challenge when review was unavailable.

The gate envelope is `{ "packetPath": "packet.json", "commentPath": "comment.md", "challengePath": "challenge.json" }`. Run `"${CLAUDE_PLUGIN_ROOT}/bin/acceptance-review-gate.ts" --input <envelope-file>`. It checks digests, marker bytes, criterion consistency, actor exclusion, source shape, and conclusion. It does not fetch GitHub or run reviewed code. Any packet or comment edit invalidates the challenge. Rebuild it after a correction. Live preflight and fresh approval are still required by [publication](acceptance-publication.md).
