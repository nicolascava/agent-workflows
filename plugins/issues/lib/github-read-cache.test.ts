import { expect, test } from "bun:test";
import { createReadCache } from "./github-read-cache.ts";
test("keys read cache by identity, variables and query, and honors freshness", async () => {
  let calls = 0, now = 1; const read = createReadCache(async () => String(++calls), () => now);
  const request = { query: "query { viewer { login } }", variables: { n: 1 }, identity: "actor-one", ttlMs: 10 };
  expect(await read(request)).toBe("1"); expect(await read(request)).toBe("1");
  expect(await read({ ...request, identity: "actor-two" })).toBe("2");
  expect(await read({ ...request, ttlMs: 0 })).toBe("3"); now = 20; expect(await read(request)).toBe("4");
});
test("never caches mutation, partial errors or failed reads", async () => {
  let calls = 0; const read = createReadCache(async () => { calls++; return '{"errors":[{}]}'; });
  await read({ query: "query { viewer { login } }", identity: "a", ttlMs: 100 }); await read({ query: "query { viewer { login } }", identity: "a", ttlMs: 100 }); expect(calls).toBe(2);
  await expect(read({ query: "# comment\nmutation { write }", identity: "a", ttlMs: 100 })).rejects.toThrow();
  await expect(read({ query: "query A { viewer { login } } mutation B { write }", identity: "a", ttlMs: 100 })).rejects.toThrow();
});
