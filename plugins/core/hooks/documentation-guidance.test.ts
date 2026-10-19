import { expect, test } from "bun:test";
import { fixture, invoke, output } from "./test-support";

test("documentation guidance is generic SessionStart context for a resolvable project", () => {
  const result = invoke("documentation-guidance", { cwd: fixture() });
  expect(result.exitCode).toBe(0);
  const context = JSON.parse(output(result)).hookSpecificOutput;
  expect(context.hookEventName).toBe("SessionStart");
  expect(context.additionalContext).toContain("repository");
  expect(context.additionalContext).toContain("documentation-currency.md");
});
test("documentation guidance is silent for invalid input or an unresolvable project", () => {
  for (const payload of ["", "{", "null", { cwd: "/missing-project" }]) {
    const result = invoke("documentation-guidance", payload);
    expect(result.exitCode).toBe(0); expect(output(result)).toBe("");
  }
});
