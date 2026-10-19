import { expect, test } from "bun:test";
import { withoutGitDiscoveryEnvironment } from "./git-environment";
import { isRecord } from "./is-record";

test("git discovery sanitization preserves the caller and unrelated environment", () => {
  const env = { PATH: "bin", GIT_DIR: "elsewhere", GIT_WORK_TREE: "elsewhere", GIT_COMMON_DIR: "elsewhere", GIT_CEILING_DIRECTORIES: "elsewhere", GIT_DISCOVERY_ACROSS_FILESYSTEM: "1", GIT_AUTHOR_NAME: "Example" };
  expect(withoutGitDiscoveryEnvironment(env)).toEqual({ PATH: "bin", GIT_AUTHOR_NAME: "Example" });
  expect(env.GIT_DIR).toBe("elsewhere");
});
test("record detection excludes null, arrays, functions, and primitive values", () => {
  for (const value of [null, [], 1, "text", undefined, () => {}]) expect(isRecord(value)).toBe(false);
  expect(isRecord({})).toBe(true); expect(isRecord(Object.create(null))).toBe(true);
});
