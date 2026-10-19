import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const roots: string[] = [];
export function cleanup() { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); }

export function fixture() {
  const root = mkdtempSync(resolve(import.meta.dir, "../../../../.web-qa-test-"));
  roots.push(root);
  const path = join(root, "tools");
  const app = join(root, "app with spaces");
  mkdirSync(path);
  mkdirSync(app);
  const log = join(root, "calls.jsonl");
  const env = { ...process.env, PATH: path, TEST_LOG: log };
  function tool(name: string, body: string, dir = path) {
    mkdirSync(dir, { recursive: true });
    const file = join(dir, name);
    writeFileSync(file, `#!${process.execPath}\n${body}\n`);
    chmodSync(file, 0o755);
  }
  function media() {
    tool("ffprobe", `console.log(process.env.TEST_DURATION || "4.25");`);
    tool("ffmpeg", `import {writeFileSync,appendFileSync} from 'node:fs';
appendFileSync(process.env.TEST_LOG, JSON.stringify(process.argv.slice(2))+'\\n');
if(process.env.TEST_FFMPEG_FAIL) process.exit(9);
writeFileSync(process.argv.at(-1), 'encoded');`);
  }
  function playwright(local = true) {
    tool("playwright", `import {mkdirSync,writeFileSync,appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2);
const config=(await import(pathToFileURL(args[args.indexOf('--config')+1]).href)).default;
appendFileSync(process.env.TEST_LOG, JSON.stringify({args,config})+'\\n');
if(process.env.TEST_PLAYWRIGHT_FAIL) process.exit(7);
if(!process.env.TEST_NO_VIDEO) { mkdirSync(config.outputDir,{recursive:true}); writeFileSync(config.outputDir+'/clip.webm','recording'); }
`, local ? join(app, "node_modules/.bin") : path);
  }
  function run(script: string, args: string[], extra = {}) {
    const child = Bun.spawnSync([process.execPath, resolve(import.meta.dir, "..", script), ...args], {
      cwd: app, env: { ...env, ...extra }, stdout: "pipe", stderr: "pipe",
    });
    return { code: child.exitCode, out: child.stdout.toString(), err: child.stderr.toString() };
  }
  const config = join(app, "playwright.config.ts");
  writeFileSync(config, `export default {testDir:'./tests',webServer:{command:'do-not-run'},use:{baseURL:'http://example.test',locale:'en'},projects:[{name:'browser',outputDir:'existing-results',use:{video:'off',locale:'fr'}}]};`);
  const video = join(app, "input.webm");
  const text = join(app, "speech.txt");
  const output = join(app, "chosen output.webm");
  writeFileSync(video, "original");
  writeFileSync(text, "A supplied walkthrough.");
  return { root, path, app, log, env, tool, media, playwright, run, config, video, text, output,
    calls: () => readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line)) };
}
