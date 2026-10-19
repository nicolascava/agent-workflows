import { spawnSync } from "node:child_process";
export type Runner = (args: string[], options?: { stdin?: string }) => Promise<string>;
export const runGh: Runner = async (args, options) => {
  const result = spawnSync("gh", args, { input: options?.stdin, encoding: "utf8", timeout: 30_000, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_PAGER: "cat" } });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr.trim() ?? "GitHub read failed");
  return result.stdout;
};
export function json(raw: string): any { return JSON.parse(raw); }
export async function graphql(gh: Runner, query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const result = json(await gh(["api", "graphql", "--input", "-"], { stdin: JSON.stringify({ query, variables }) }));
  if (result.errors?.length || !result.data) throw new Error("Incomplete GraphQL response");
  return result.data;
}
export async function connection(gh: Runner, query: string, variables: Record<string, unknown>, select: (data: any) => any): Promise<any[]> {
  const nodes: any[] = [], cursors = new Set<string>(); let after: string | null = null;
  for (let page = 0; page < 50; page++) {
    const value = select(await graphql(gh, query, { ...variables, after }));
    if (!Array.isArray(value?.nodes) || typeof value.pageInfo?.hasNextPage !== "boolean") throw new Error("Incomplete pagination");
    if (value.nodes.some((node: unknown) => node == null)) throw new Error("Missing connection node");
    nodes.push(...value.nodes);
    if (!value.pageInfo.hasNextPage) return nodes;
    const cursor = value.pageInfo.endCursor;
    if (typeof cursor !== "string" || !cursor || cursors.has(cursor)) throw new Error("Invalid pagination cursor");
    cursors.add(cursor); after = cursor;
  }
  throw new Error("Pagination limit reached; result is incomplete");
}
