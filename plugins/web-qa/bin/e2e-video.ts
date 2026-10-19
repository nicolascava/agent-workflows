#!/usr/bin/env bun
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { destination, duration, main, publish, recordings, run, tool } from "./lib/runtime";

function playwright(directory: string): string {
  for (let current = directory; ; current = dirname(current)) {
    const local = Bun.which(join(current, "node_modules/.bin/playwright"));
    if (local) return local;
    if (dirname(current) === current) break;
  }
  const available = Bun.which("playwright");
  if (!available) throw new Error("Playwright is required in the target repository or on PATH. Nothing was installed. An available browser tool can record manually instead.");
  return available;
}

main(() => {
  const [configArg, outputArg, ...specs] = process.argv.slice(2);
  if (!configArg || !outputArg || specs.some(spec => spec.startsWith("-"))) throw new Error("Usage: e2e-video.ts <config-path> <output.webm> [spec-filter ...]");
  const config = resolve(configArg);
  if (!existsSync(config) || !statSync(config).isFile()) throw new Error("Playwright config must be an existing file.");
  const output = destination(outputArg);
  const encoder = tool("ffmpeg");
  const probe = tool("ffprobe");
  const runner = playwright(dirname(config));
  const scratch = mkdtempSync(join(dirname(config), ".web-qa-"));
  const temporaryConfig = `${scratch}.config.ts`;
  try {
    const artifacts = join(scratch, "artifacts");
    // Keep the config beside the original so relative test paths keep their meaning.
    writeFileSync(temporaryConfig, `import original from ${JSON.stringify("./" + basename(config))};
const outputDir = ${JSON.stringify(artifacts)};
const video = { mode: 'on', size: { width: 1920, height: 1080 } };
const use = { ...original.use, viewport: { width: 1920, height: 1080 }, video };
export default {
  ...original, outputDir, webServer: undefined, workers: 1, retries: 0, use,
  projects: original.projects?.map((project, index) => ({
    ...project, outputDir: outputDir + '/' + index, retries: 0,
    use: { ...use, ...project.use, viewport: use.viewport, video },
  })),
};
`);
    run(runner, ["test", "--config", temporaryConfig, "--workers=1", "--reporter=line", ...specs], "Playwright");
    const clips = existsSync(artifacts) ? recordings(artifacts) : [];
    if (!clips.length) throw new Error("No recordings were produced. Check the selected tests and their page fixtures.");
    const list = join(scratch, "clips.txt");
    writeFileSync(list, clips.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"));
    const encoded = join(scratch, "output.webm");
    run(encoder, ["-nostdin", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", encoded], "ffmpeg");
    const seconds = duration(probe, encoded);
    publish(encoded, output);
    console.log(JSON.stringify({ output, clips: clips.length, durationSeconds: seconds, bytes: statSync(output).size }));
  } finally {
    rmSync(temporaryConfig, { force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
});
