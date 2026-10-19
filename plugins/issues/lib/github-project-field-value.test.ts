import { expect, test } from "bun:test";
import { selectFieldName, resolveFieldValue } from "./github-project-field-value.ts";
test("reads select and text values without treating populated text as blank", () => {
  expect(selectFieldName({ name: "P1", text: "P2" })).toBe("P1"); expect(selectFieldName({ text: "P2" })).toBe("P2");
  for (const value of [undefined, null, {}, { text: "" }]) expect(selectFieldName(value)).toBeNull();
});
test("resolves runtime field IDs for select, text, and explicit clear", () => {
  const field = { id: "F", name: "Stage", dataType: "SINGLE_SELECT", options: [{ id: "O", name: "Inbox" }] };
  expect(resolveFieldValue([field], "Stage", "Inbox")).toEqual({ fieldId: "F", value: { singleSelectOptionId: "O" } });
  expect(resolveFieldValue([field], "Stage", null)).toEqual({ fieldId: "F", value: null });
  expect(resolveFieldValue([{ ...field, dataType: "TEXT" }], "Stage", "custom").value).toEqual({ text: "custom" });
  expect(() => resolveFieldValue([field], "Stage", "Unknown")).toThrow(); expect(() => resolveFieldValue([field, field], "Stage", null)).toThrow();
});
