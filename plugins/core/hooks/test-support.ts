import { afterEach } from "bun:test";
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const pluginRoot = realpathSync(resolve(import.meta.dir, ".."));
const temporary: string[] = [];
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });
export function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "core-hooks-")));
  temporary.push(root);
  return root;
}
export function put(root: string, path: string, contents: string | object, mode?: number) {
  const target = join(root, path);
  mkdirSync(resolve(target, ".."), { recursive: true });
  writeFileSync(target, typeof contents === "string" ? contents : JSON.stringify(contents), { mode });
  return target;
}
export function invoke(name: string, payload: unknown, env: Record<string, string> = {}, root = pluginRoot) {
  return Bun.spawnSync(["bash", join(root, "hooks", `${name}.sh`)], {
    stdin: typeof payload === "string" ? Buffer.from(payload) : Buffer.from(JSON.stringify(payload)),
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: root, CORE_FORMAT_AFTER_EDIT: "", ...env },
    timeout: 6000,
  });
}
export function output(result: ReturnType<typeof invoke>) { return result.stdout.toString(); }
