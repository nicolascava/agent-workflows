import { expect, test } from "bun:test";
import { issueStructureGate } from "./issue-structure-gate.ts";
const body = "## Problem\n\nSaving loses data.\n\n## Constraints\n\nRetain access.\n\n## No-gos\n\nNo data loss.\n\n## Sources\n\nhttps://example.com/report\n";
test("requires new shaped sections with advisory word budget", () => {
  expect(issueStructureGate(body, "draft").status).toBe("warn");
  for (const invalid of [body.replace("## Constraints", "## **Constraints**"), body.replace("No data loss.", "Unknown."), body + "\n## Suggested solution\n\nDo this."]) expect(issueStructureGate(invalid, "draft").status).toBe("fail");
});
test("keeps the legacy Solution contract read-only", () => {
  const legacy = body.replace("## Constraints", "## Solution");
  expect(issueStructureGate(legacy, "readback").status).not.toBe("fail"); expect(issueStructureGate(legacy, "draft").status).toBe("fail");
});
test("a refined readback cannot fall back to a legacy Solution", () => {
  expect(issueStructureGate(body.replace("## Constraints", "## Solution"), "refined").status).toBe("fail");
});
