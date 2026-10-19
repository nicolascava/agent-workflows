import { expect, test } from "bun:test";
import { deriveParentProjectRollup, deriveParentProjectStatus, planHierarchy, applyHierarchyPlan } from "./parent-project.ts";
const ranks = { impact: ["High", "Medium", "Low"], effort: ["High", "Medium", "Low"], priority: ["P0", "P1", "P2", "P3", "P4"] };
test("rolls up only direct children and clears empty fields", () => {
  expect(deriveParentProjectRollup([{ id: "a", fields: { priority: "P2", impact: "Low" }, descendants: [{ fields: { priority: "P0" } }] }, { id: "b", fields: { priority: "P1", effort: "High" } }], ranks)).toEqual({ priority: "P1", impact: "Low", effort: "High" });
  expect(deriveParentProjectRollup([], ranks)).toEqual({ priority: null, impact: null, effort: null });
});
test("derives active parent status from configured lifecycle values", () => {
  const statuses = { building: "Doing", review: "Review", acceptance: "Check", shipped: "Done" };
  expect(deriveParentProjectStatus([{ status: "Review" }], statuses)).toBe("Doing"); expect(deriveParentProjectStatus([{ status: "Done" }], statuses)).toBeNull();
});
test("preflights all attachments and refuses nested hierarchy or reparenting", () => {
  const parent = { id: "p", parentId: null, children: ["a"] };
  expect(planHierarchy("attach", parent, [{ id: "a", parentId: "p", childCount: 0 }, { id: "b", parentId: null, childCount: 0 }])).toEqual([{ operation: "attach", parentId: "p", childId: "b" }]);
  for (const child of [{ id: "b", parentId: null, childCount: 1 }, { id: "b", parentId: "other", childCount: 0 }]) expect(() => planHierarchy("attach", parent, [child])).toThrow();
  expect(() => planHierarchy("attach", { ...parent, parentId: "other" }, [{ id: "b", parentId: null, childCount: 0 }])).toThrow();
});
test("reorder requires exact membership and always uses one anchor", () => {
  const parent = { id: "p", parentId: null, children: ["a", "b", "c"] };
  const children = ["c", "b", "a"].map(id => ({ id, parentId: "p", childCount: 0 }));
  expect(planHierarchy("reorder", parent, children)[0]).toEqual({ operation: "reorder", parentId: "p", childId: "c", beforeId: "a" });
  expect(() => planHierarchy("reorder", parent, children.slice(1))).toThrow();
});
test("mutations require explicit authority and report partial progress without retries", async () => {
  const plan = ["a", "b", "c"].map(childId => ({ operation: "attach" as const, parentId: "p", childId }));
  await expect(applyHierarchyPlan(plan, async () => {}, false)).rejects.toThrow("authority");
  let calls = 0; const result = await applyHierarchyPlan(plan, async () => { if (++calls === 2) throw Error("failure"); }, true);
  expect(result.completed).toEqual([plan[0]]); expect(result.failed).toEqual(plan[1]); expect(result.notAttempted).toEqual([plan[2]]); expect(calls).toBe(2);
});
