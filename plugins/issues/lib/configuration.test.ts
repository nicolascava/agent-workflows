import { expect, test } from "bun:test";
import { parseConfiguration, resolveConfiguration } from "./configuration.ts";

test("missing configuration degrades to plain issues without a board call", async () => {
  const calls: string[][] = [];
  const result = await resolveConfiguration({}, async args => { calls.push(args); return '{"nameWithOwner":"sample/widgets"}'; });
  expect(result.repository).toBe("sample/widgets"); expect(result.project).toBeNull();
  expect(result.message).toContain("plain issues"); expect(calls).toHaveLength(1);
});
test("reads arbitrary configured board names and options from the target", async () => {
  const raw = { issues: { project: { owner: "sample", number: 42 }, fields: { status: "Stage" }, statuses: { triage: "Inbox" }, issueTypes: { bug: "Defect" } } };
  const result = await resolveConfiguration(raw, async args => args[0] === "repo" ? '{"nameWithOwner":"sample/widgets"}' : '{"id":"board-live","number":42,"title":"Work","closed":false}');
  expect(result.project?.id).toBe("board-live"); expect(result.fields.status).toBe("Stage"); expect(result.statuses.triage).toBe("Inbox"); expect(result.issueTypes.bug).toBe("Defect");
});
test("unavailable boards degrade with a clear message", async () => {
  const result = await resolveConfiguration({ issues: { project: { owner: "sample", number: 2 } } }, async args => { if (args[0] === "repo") return '{"nameWithOwner":"sample/widgets"}'; throw Error("no access"); });
  expect(result.project).toBeNull(); expect(result.message).toContain("plain issues");
});
test("rejects malformed settings, unsafe numbers, and unknown keys", () => {
  for (const issues of [{ project: { owner: "sample", number: 0 } }, { fields: { status: 4 } }, { surprise: true }, { statuses: { ready: "" } }]) expect(() => parseConfiguration({ issues })).toThrow();
});
test("rejects explicit null sections and false project declarations", () => {
  for (const issues of [null, { project: null }, { project: false }, { project: 0 }, { project: [] }]) expect(() => parseConfiguration({ issues })).toThrow();
});
test("explicit project arguments override repository settings", async () => {
  const result = await resolveConfiguration({ issues: { project: { owner: "sample", number: 2 } } }, async args => args[0] === "repo" ? '{"nameWithOwner":"sample/widgets"}' : '{"id":"B","number":3,"title":"Other","closed":false}', { project: "sample/3" });
  expect(result.project?.number).toBe(3);
});
