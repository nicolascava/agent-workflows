import { afterEach, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { cleanup, fixture } from "./lib/test-support";

afterEach(cleanup);

test("init prints a config for the supplied URL and test directory without writing", () => {
  const f = fixture();
  const before = readdirSync(f.app);
  const r = f.run("e2e-init.ts", ["http://example.test:8123", "browser tests"]);
  expect(r.code).toBe(0);
  expect(r.out).toContain('baseURL: "http://example.test:8123"');
  expect(r.out).toContain('testDir: "browser tests"');
  expect(r.out).not.toContain("webServer");
  expect(readdirSync(f.app)).toEqual(before);
});

test("init requires an explicit HTTP URL and test directory", () => {
  const f = fixture();
  for (const args of [[], ["file:///etc/passwd", "tests"], ["http://example.test"]]) {
    const r = f.run("e2e-init.ts", args);
    expect(r.code).not.toBe(0);
    expect(r.err).toMatch(/Usage|HTTP/);
  }
});
