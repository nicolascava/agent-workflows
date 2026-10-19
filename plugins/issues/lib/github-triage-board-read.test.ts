import { expect, test } from "bun:test";
import { readProjectFields, readBoardSnapshot, readItemState } from "./github-triage-board-read.ts";
const project = { id: "B", number: 9, title: "Work" };
const envelope = (key: string, nodes: unknown[], more = false, cursor: string | null = null) => JSON.stringify({ data: { node: { ...project, [key]: { nodes, pageInfo: { hasNextPage: more, endCursor: cursor } } } } });
test("reads live field data with arbitrary names and runtime options", async () => {
  let calls = 0;
  const gh = async () => { calls++; return envelope("fields", [{ id: "F", name: "Stage", dataType: "SINGLE_SELECT", options: [{ id: "O", name: "Inbox" }] }]); };
  expect((await readProjectFields(gh, project.id)).fields[0].name).toBe("Stage"); await readProjectFields(gh, project.id); expect(calls).toBe(2);
});
test("paginates snapshots and preserves text values", async () => {
  let calls = 0;
  const gh = async () => envelope("items", [{ id: String(++calls), content: { __typename: "Issue", number: calls, title: "Work", url: `https://github.com/sample/widgets/issues/${calls}` }, fieldValues: { nodes: [{ field: { name: "Urgency" }, text: "P0" }], pageInfo: { hasNextPage: false } } }], calls === 1, "next");
  const result = await readBoardSnapshot(gh, "B"); expect(result.items).toHaveLength(2); expect(result.items[0].values.Urgency).toBe("P0");
});
test("never reports truncated field values as blank", async () => {
  await expect(readBoardSnapshot(async () => envelope("items", [{ id: "I", content: null, fieldValues: { nodes: [], pageInfo: { hasNextPage: true } } }]), "B")).rejects.toThrow();
});
test("item lookup is fresh and refuses duplicate matches", async () => {
  const gh = async () => envelope("projectItems", [{ id: "I", project: { id: "B" }, fieldValues: { nodes: [], pageInfo: { hasNextPage: false } } }]);
  expect((await readItemState(gh, "ISSUE", "B"))?.id).toBe("I");
  await expect(readItemState(async () => envelope("projectItems", [1, 2].map(n => ({ id: String(n), project: { id: "B" }, fieldValues: { nodes: [], pageInfo: { hasNextPage: false } } }))), "ISSUE", "B")).rejects.toThrow();
});
