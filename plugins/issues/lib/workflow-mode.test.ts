import { expect, test } from "bun:test";
import { workflowMode } from "./workflow-mode.ts";
test("keeps read operations available without a delivery mode", () => {
  expect(workflowMode(undefined)).toEqual({ mode: null, deliveryMutations: false });
  expect(workflowMode({ workflow: "pr" }).mode).toBe("pr");
  expect(workflowMode({ workflow: "solo-shaped-kanban" }).deliveryMutations).toBe(true);
  expect(() => workflowMode({ workflow: "unknown" })).toThrow();
});
