import { expect, test } from "bun:test";
import { workflowMode } from "./workflow-mode.ts";
test("treats an absent declaration as pr and rejects unknown modes", () => {
  expect(workflowMode(undefined)).toEqual({ mode: "pr", deliveryMutations: true });
  expect(workflowMode({ workflow: "pr" }).mode).toBe("pr");
  expect(workflowMode({ workflow: "solo-shaped-kanban" }).deliveryMutations).toBe(true);
  for (const raw of [{ workflow: "unknown" }, {}, null, []]) expect(() => workflowMode(raw)).toThrow();
});
