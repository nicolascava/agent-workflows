import { constants, copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

export function tool(name: string): string {
  const found = Bun.which(name);
  if (!found) throw new Error(`${name} is required on PATH. Nothing was installed.`);
  return found;
}

export function run(executable: string, args: string[], label: string, env = process.env): string {
  const child = Bun.spawnSync([executable, ...args], {
    env, stdout: "pipe", stderr: "pipe", timeout: 300_000,
  });
  if (child.exitCode !== 0 || child.signalCode) {
    const details = [child.stderr, child.stdout].map(value => value.toString().trim()).filter(Boolean).join("\n");
    throw new Error(`${label} failed (${child.signalCode || child.exitCode}).${details ? `\n${details}` : ""}`);
  }
  return child.stdout.toString().trim();
}

export function destination(value: string): string {
  const output = resolve(value);
  if (extname(output).toLowerCase() !== ".webm") throw new Error("Choose an output path ending in .webm.");
  if (!existsSync(dirname(output))) throw new Error("Output parent directory must exist.");
  if (existsSync(output)) throw new Error(`Output already exists: ${output}`);
  return output;
}

export function duration(probe: string, file: string): number {
  const value = Number(run(probe, ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], "ffprobe"));
  if (!Number.isFinite(value) || value <= 0) throw new Error("ffprobe returned an invalid duration.");
  return value;
}

export function publish(file: string, output: string) {
  if (!statSync(file).size) throw new Error("Encoder produced an empty file.");
  copyFileSync(file, output, constants.COPYFILE_EXCL);
}

export function recordings(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? recordings(path) : entry.isFile() && extname(path) === ".webm" ? [path] : [];
  }).sort();
}

export function main(fn: () => void) {
  try { fn(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
