import { createHash } from "node:crypto";
import { normalizeRepository, positive } from "./github-target.ts";
const oid = (value: unknown) => typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value);
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export function acceptanceReviewGate(input: { packetBytes: string; comment: string; challenge: any }) {
  const packet = JSON.parse(input.packetBytes), challenge = input.challenge;
  const refuse = (message: string): never => { throw new Error(`Acceptance gate: ${message}`); };
  if (packet.schema !== 1 || !packet.session || !["Passed", "Failed"].includes(packet.conclusion)) refuse("invalid packet envelope");
  normalizeRepository(packet.repository); positive(packet.issue);
  const source = packet.source;
  if (source?.status !== "ready" || source.mode !== "current-worktree" || source.dirty !== false || !oid(source.headOid) || !oid(source.treeOid) || !oid(source.baseOid) || source.headOid !== source.baseOid) refuse("require a clean immutable delivery source");
  if (!Array.isArray(packet.mergedPullRequests) || !packet.mergedPullRequests.length || packet.mergedPullRequests.some((pr: any) => !Number.isSafeInteger(pr.number) || pr.number < 1 || !oid(pr.mergeOid) || pr.ancestorVerified !== true || !Array.isArray(pr.authors) || !pr.authors.length || pr.authors.some((author: any) => typeof author !== "string" || !author))) refuse("incomplete linked merged PR evidence");
  if (!Array.isArray(packet.assignees) || !packet.actor || [...packet.assignees, ...packet.mergedPullRequests.flatMap((pr: any) => pr.authors)].some((actor: string) => actor.toLowerCase() === packet.actor.toLowerCase())) refuse("posting actor must be independent of builders and assignees");
  if (!Array.isArray(packet.criteria) || !packet.criteria.length || new Set(packet.criteria.map((c: any) => c.id)).size !== packet.criteria.length) refuse("criteria must have unique IDs");
  for (const criterion of packet.criteria) {
    if (!criterion.id || !["outcome", "no-go", "constraint"].includes(criterion.kind) || !["Passed", "Failed", "Held", "Violated", "N/A", "Unverified"].includes(criterion.result) || !["traced", "observed", "reported", "unverified"].includes(criterion.evidence) || !criterion.detail?.trim()) refuse("incomplete criterion");
    if (criterion.result !== "Unverified" && (!["traced", "observed"].includes(criterion.evidence) || criterion.sourceOid !== source.baseOid)) refuse("conclusive criteria require pinned trace or observation");
    if (criterion.kind === "no-go" && !["Held", "Violated", "N/A", "Unverified"].includes(criterion.result)) refuse("invalid no-go result");
    if (criterion.kind !== "no-go" && !["Passed", "Failed", "N/A", "Unverified"].includes(criterion.result)) refuse("invalid outcome or constraint result");
  }
  if (packet.criteria.every((c: any) => c.result === "Unverified")) refuse("all criteria are unverified");
  if (!Array.isArray(packet.findings)) refuse("missing findings");
  for (const finding of packet.findings) {
    const criterion = packet.criteria.find((c: any) => c.id === finding.criterionId);
    if (!criterion || !["critical", "major", "minor"].includes(finding.severity) || !["Failed", "Violated"].includes(criterion.result)) refuse("findings must link to unmet criteria");
  }
  const conclusion = packet.findings.some((finding: any) => ["critical", "major"].includes(finding.severity)) ? "Failed" : "Passed";
  if (packet.conclusion !== conclusion || !input.comment.startsWith(conclusion)) refuse("conclusion does not match evidence and comment");
  const markers = [...input.comment.matchAll(/<!-- issues-acceptance:([a-f0-9]{64}):([A-Za-z0-9_-]+) -->/g)];
  if (markers.length !== 1 || markers[0][1] !== digest(input.packetBytes) || Buffer.from(markers[0][2], "base64url").toString("utf8") !== input.packetBytes) refuse("comment must carry the exact evidence packet");
  if (!challenge || challenge.packetDigest !== digest(input.packetBytes) || challenge.commentDigest !== digest(input.comment) || challenge.session !== packet.session || challenge.independent !== true || challenge.completed !== true || challenge.agrees !== true || !Array.isArray(challenge.objections) || challenge.objections.length) refuse("missing exact independent challenge");
  return { conclusion, packetDigest: digest(input.packetBytes), commentDigest: digest(input.comment), session: packet.session };
}
