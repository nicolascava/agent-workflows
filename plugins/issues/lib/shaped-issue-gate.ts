import { issueStructureGate } from "../skills/triage/helpers/issue-structure-gate.ts";
export function seedPriority(effort: string, impact: string, existing: string | null): string | null {
  if (existing) return existing;
  const effortIndex = ["low", "medium", "high"].indexOf(effort), impactIndex = ["high", "medium", "low"].indexOf(impact);
  return effortIndex < 0 || impactIndex < 0 ? null : `P${effortIndex + impactIndex}`;
}
export function shapedIssueGate(input: { body: string; boardAvailable: boolean; blockers: { state: string }[]; blocked: boolean }) {
  const structure = issueStructureGate(input.body, "readback");
  const reasons = [...structure.errors];
  if (!input.boardAvailable) reasons.push("Plain issue; no ready transition is available");
  if (input.blocked || input.blockers.some(blocker => blocker.state !== "CLOSED")) reasons.push("Resolve direct blockers and decision impediments first");
  return { ready: !reasons.length, reasons, structure };
}
