import { expect, test } from "bun:test";
import { options } from "./cli.ts";
test("rejects unknown, duplicate and valueless options before any operation", () => {
  expect(options(["--repo", "sample/widgets"], ["repo"])).toEqual({ repo: "sample/widgets" });
  for (const args of [["--bad", "x"], ["--repo"], ["--repo", "x", "--repo", "y"], ["--repo", "--apply"]]) expect(() => options(args, ["repo"])).toThrow();
});
