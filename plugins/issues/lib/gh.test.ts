import { expect, test } from "bun:test";
import { graphql, connection, json } from "./gh.ts";

test("rejects partial GraphQL data and malformed JSON", async () => {
  expect(() => json("oops")).toThrow();
  await expect(graphql(async () => '{"data":{},"errors":[{}]}', "query { viewer { login } }")).rejects.toThrow();
});
test("passes variables in stdin and follows every cursor", async () => {
  const seen: unknown[] = [];
  const result = await connection(async (args, options) => {
    expect(args).toEqual(["api", "graphql", "--input", "-"]);
    const payload = JSON.parse(options!.stdin!); seen.push(payload.variables.after);
    return JSON.stringify({ data: { rows: { nodes: [payload.variables.after ?? "first"], pageInfo: { hasNextPage: seen.length === 1, endCursor: "next" } } } });
  }, "query", {}, data => data.rows);
  expect(result).toEqual(["first", "next"]); expect(seen).toEqual([null, "next"]);
});
test("refuses stuck cursors and malformed pagination", async () => {
  for (const pageInfo of [{}, { hasNextPage: true, endCursor: null }, { hasNextPage: true, endCursor: "same" }]) {
    await expect(connection(async () => JSON.stringify({ data: { rows: { nodes: [], pageInfo } } }), "query", {}, d => d.rows)).rejects.toThrow();
  }
});
