import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { acceptanceReviewGate } from "./acceptance-review-gate.ts";
const oid = "a".repeat(40), digest = (s: string) => createHash("sha256").update(s).digest("hex");
function input() {
  const packet = { schema: 1, repository: "sample/widgets", issue: 1, session: "session-1", conclusion: "Passed", source: { status: "ready", mode: "current-worktree", headOid: oid, baseOid: oid, treeOid: oid, dirty: false }, mergedPullRequests: [{ number: 2, mergeOid: oid, ancestorVerified: true, authors: ["builder"] }], assignees: ["owner"], actor: "reviewer", criteria: [{ id: "c1", kind: "outcome", result: "Passed", evidence: "traced", sourceOid: oid, detail: "src/save.ts:10" }, { id: "c2", kind: "no-go", result: "Held", evidence: "observed", sourceOid: oid, detail: "Observed at deployed commit." }], findings: [] };
  const packetBytes = JSON.stringify(packet), comment = `Passed. The agreed outcome is ready.\n\n<!-- issues-acceptance:${digest(packetBytes)}:${Buffer.from(packetBytes).toString("base64url")} -->`;
  return { packetBytes, comment, challenge: { packetDigest: digest(packetBytes), commentDigest: digest(comment), session: packet.session, independent: true, completed: true, agrees: true, objections: [] } };
}
test("binds a completed independent challenge to the exact packet and comment", () => {
  expect(acceptanceReviewGate(input()).conclusion).toBe("Passed");
  expect(() => acceptanceReviewGate({ ...input(), comment: "Changed." })).toThrow();
  expect(() => acceptanceReviewGate({ ...input(), challenge: { ...input().challenge, completed: false } })).toThrow();
});
test("rejects all-unverified evidence, builder publication, dirty source and broken findings", () => {
  for (const change of [(p: any) => p.criteria.forEach((c: any) => { c.result = "Unverified"; c.evidence = "unverified"; }), (p: any) => p.actor = "builder", (p: any) => p.source.dirty = true, (p: any) => p.findings.push({ severity: "major", criterionId: "missing" })]) {
    const value = input(), packet = JSON.parse(value.packetBytes); change(packet); value.packetBytes = JSON.stringify(packet); value.challenge.packetDigest = digest(value.packetBytes);
    expect(() => acceptanceReviewGate(value)).toThrow();
  }
});
test("a failed criterion with a major finding yields Failed; reported no-gos cannot pass", () => {
  const value = input(), packet = JSON.parse(value.packetBytes); packet.conclusion = "Failed"; packet.criteria[0].result = "Failed"; packet.findings = [{ severity: "major", criterionId: "c1" }];
  value.packetBytes = JSON.stringify(packet); value.comment = `Failed. Saving still fails.\n\n<!-- issues-acceptance:${digest(value.packetBytes)}:${Buffer.from(value.packetBytes).toString("base64url")} -->`; value.challenge.packetDigest = digest(value.packetBytes); value.challenge.commentDigest = digest(value.comment);
  expect(acceptanceReviewGate(value).conclusion).toBe("Failed");
  packet.criteria[1].evidence = "reported"; value.packetBytes = JSON.stringify(packet); value.challenge.packetDigest = digest(value.packetBytes); expect(() => acceptanceReviewGate(value)).toThrow();
});
test("the published comment must carry the exact immutable packet", () => {
  const value = input(); value.comment = "Passed. No embedded packet."; value.challenge.commentDigest = digest(value.comment);
  expect(() => acceptanceReviewGate(value)).toThrow();
});
test("rejects no-go vocabulary on outcomes and constraints with valid packet bindings", () => {
  for (const kind of ["outcome", "constraint"]) for (const result of ["Held", "Violated"]) {
    const value = input(), packet = JSON.parse(value.packetBytes);
    packet.criteria[0] = { ...packet.criteria[0], kind, result };
    value.packetBytes = JSON.stringify(packet);
    value.comment = `Passed.\n<!-- issues-acceptance:${digest(value.packetBytes)}:${Buffer.from(value.packetBytes).toString("base64url")} -->`;
    value.challenge.packetDigest = digest(value.packetBytes); value.challenge.commentDigest = digest(value.comment);
    expect(() => acceptanceReviewGate(value)).toThrow("invalid outcome or constraint result");
  }
});
