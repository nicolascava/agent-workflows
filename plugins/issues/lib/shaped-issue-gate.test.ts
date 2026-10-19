import { expect, test } from "bun:test";
import { shapedIssueGate, seedPriority } from "./shaped-issue-gate.ts";
test("seeds the priority matrix only when a value is missing and estimates are known", () => {
  expect(seedPriority("low", "high", null)).toBe("P0"); expect(seedPriority("high", "low", null)).toBe("P4");
  expect(seedPriority("low", "high", "P3")).toBe("P3"); expect(seedPriority("unknown", "high", null)).toBeNull();
});
test("ready gate stops on direct blockers and absent board configuration", () => {
  const body = "## Problem\n\nSaving fails.\n\n## Constraints\n\nRetain access.\n\n## No-gos\n\nDo not lose data.\n\n## Sources\n\nhttps://example.com/report";
  expect(shapedIssueGate({ body, boardAvailable: false, blockers: [], blocked: false }).ready).toBe(false);
  expect(shapedIssueGate({ body, boardAvailable: true, blockers: [{ state: "OPEN" }], blocked: false }).ready).toBe(false);
  expect(shapedIssueGate({ body, boardAvailable: true, blockers: [{ state: "CLOSED" }], blocked: false }).ready).toBe(true);
});
