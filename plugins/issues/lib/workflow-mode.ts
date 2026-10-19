// This reads a declaration supplied by the caller, never another plugin's files.
export function workflowMode(raw: unknown) {
  if (raw === undefined) return { mode: null, deliveryMutations: false };
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || !["pr", "solo-shaped-kanban"].includes((raw as any).workflow)) throw new Error("Unknown workflow; delivery mutations are blocked");
  return { mode: (raw as { workflow: "pr" | "solo-shaped-kanban" }).workflow, deliveryMutations: true };
}
