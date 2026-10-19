import { readFileSync } from "node:fs";
export function options(args: string[], allowed: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index]?.slice(2), value = args[index + 1];
    if (!args[index]?.startsWith("--") || !allowed.includes(key) || Object.hasOwn(result, key) || !value || value.startsWith("--")) throw new Error("Unknown, duplicate or missing option");
    result[key] = value;
  }
  return result;
}
export function required(value: string | undefined, name: string): string { if (!value) throw new Error(`Missing --${name}`); return value; }
export function input(path: string | undefined) { return JSON.parse(readFileSync(required(path, "input"), "utf8")); }
export async function cli(main: () => unknown | Promise<unknown>) {
  try { console.log(JSON.stringify(await main(), null, 2)); }
  catch { console.error("Issue helper refused: invalid input, incomplete evidence, or GitHub read failure. No retry was attempted."); process.exitCode = 1; }
}
