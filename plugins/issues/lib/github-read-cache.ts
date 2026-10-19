import { json, type Runner } from "./gh.ts";
function stable(value: any): any { return Array.isArray(value) ? value.map(stable) : value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])])) : value; }
export function createReadCache(gh: Runner, now = Date.now) {
  const cache = new Map<string, { at: number; raw: string }>();
  return async (request: { query: string; variables?: Record<string, unknown>; identity: string; ttlMs: number }) => {
    const query = request.query.replace(/#[^\n]*/g, "").trim();
    if (!/^query\b/.test(query) || /\b(?:mutation|subscription)\b/.test(query) || !request.identity || request.ttlMs < 0) throw new Error("Cache accepts identified read queries only");
    const key = JSON.stringify([request.identity, request.query, stable(request.variables ?? {})]);
    const old = cache.get(key);
    if (request.ttlMs > 0 && old && now() - old.at < request.ttlMs) return old.raw;
    const raw = await gh(["api", "graphql", "--input", "-"], { stdin: JSON.stringify({ query: request.query, variables: request.variables ?? {} }) });
    const result = json(raw);
    if (!result?.errors?.length) cache.set(key, { at: now(), raw });
    return raw;
  };
}
