export function deriveParentProjectRollup(children: any[], ranks: Record<string, string[]>) {
  return Object.fromEntries(["priority", "impact", "effort"].map(key => {
    const values = children.map(child => child.fields?.[key]).filter(value => value != null && value !== "");
    if (values.some(value => !ranks[key]?.includes(value))) throw new Error(`Unknown ${key} rank`);
    return [key, ranks[key]?.find(value => values.includes(value)) ?? null];
  }));
}
export function deriveParentProjectStatus(children: any[], statuses: Record<string, string>) {
  return children.some(child => [statuses.building, statuses.review, statuses.acceptance].filter(Boolean).includes(child.status)) ? statuses.building ?? null : null;
}
export type Operation = { operation: "attach" | "detach" | "reorder"; parentId: string; childId: string; beforeId?: string; afterId?: string };
export function planHierarchy(operation: Operation["operation"], parent: { id: string; parentId: string | null; children: string[] }, children: { id: string; parentId: string | null; childCount: number }[]): Operation[] {
  if (parent.parentId || new Set(children.map(c => c.id)).size !== children.length || children.some(c => c.id === parent.id)) throw new Error("Invalid one-level hierarchy");
  if (operation === "attach") {
    if (children.some(c => c.childCount > 0 || c.parentId && c.parentId !== parent.id)) throw new Error("Cannot nest or reparent a child");
    return children.filter(c => !parent.children.includes(c.id)).map(c => ({ operation, parentId: parent.id, childId: c.id }));
  }
  if (operation === "detach") return children.filter(c => parent.children.includes(c.id)).map(c => ({ operation, parentId: parent.id, childId: c.id }));
  if (children.length !== parent.children.length || children.some(c => !parent.children.includes(c.id))) throw new Error("Reorder requires exact membership");
  const current = [...parent.children], plan: Operation[] = [];
  for (let index = 0; index < children.length; index++) {
    const id = children[index].id;
    if (current[index] === id) continue;
    plan.push({ operation, parentId: parent.id, childId: id, ...(index === 0 ? { beforeId: current[0] } : { afterId: children[index - 1].id }) });
    current.splice(current.indexOf(id), 1); current.splice(index, 0, id);
  }
  return plan;
}
export async function applyHierarchyPlan(plan: Operation[], write: (operation: Operation) => Promise<unknown>, authorized: boolean) {
  if (!authorized) throw new Error("Explicit mutation authority is required");
  const completed: Operation[] = [];
  for (let index = 0; index < plan.length; index++) {
    try { await write(plan[index]); completed.push(plan[index]); }
    catch (error) { return { completed, failed: plan[index], notAttempted: plan.slice(index + 1), error: String(error) }; }
  }
  return { completed, failed: null, notAttempted: [] };
}
