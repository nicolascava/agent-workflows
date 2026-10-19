import { afterEach, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cleanup, fixture } from "./lib/test-support";

afterEach(cleanup);

for (const engine of ["say", "espeak"]) test(`narration uses detected local ${engine} and supplied text`, () => {
  const f = fixture(); f.media();
  f.tool(engine, `import {writeFileSync,appendFileSync} from 'node:fs';
const a=process.argv.slice(2); appendFileSync(process.env.TEST_LOG,JSON.stringify(a)+'\\n');
writeFileSync(a[a.indexOf('${engine === "say" ? "-o" : "-w"}')+1],'audio');`);
  const r = f.run("e2e-narrate.ts", [f.video, f.text, f.output]);
  expect(r.code).toBe(0); expect(JSON.parse(r.out).engine).toBe(engine);
  expect(f.calls()[0]).toContain(f.text);
  expect(f.calls()[1]).toContain("apad");
  expect(readFileSync(f.video, "utf8")).toBe("original");
  expect(readFileSync(f.output, "utf8")).toBe("encoded");
  expect(readdirSync(f.app).filter(n => n.startsWith(".web-qa-"))).toEqual([]);
});

for (const missing of ["ffmpeg", "ffprobe", "local TTS"]) test(`narration explains missing ${missing}`, () => {
  const f = fixture();
  if (missing !== "ffmpeg") f.tool("ffmpeg", "process.exit(0)");
  if (missing !== "ffprobe") f.tool("ffprobe", "console.log(4)");
  if (missing !== "local TTS") f.tool("say", "process.exit(0)");
  const r = f.run("e2e-narrate.ts", [f.video, f.text, f.output]);
  expect(r.code).not.toBe(0); expect(r.err).toContain(missing);
});

test("narration rejects audio longer than video and cleans scratch files", () => {
  const f = fixture(); f.media();
  f.tool("say", `import {writeFileSync} from 'node:fs';writeFileSync(process.argv[process.argv.indexOf('-o')+1],'audio')`);
  f.tool("ffprobe", `console.log(process.argv.at(-1).endsWith('.aiff') ? 8 : 4)`);
  const r = f.run("e2e-narrate.ts", [f.video, f.text, f.output]);
  expect(r.code).not.toBe(0); expect(r.err).toContain("longer");
  expect(existsSync(f.output)).toBe(false);
  expect(readdirSync(f.app).filter(n => n.startsWith(".web-qa-"))).toEqual([]);
});

test("narration preserves existing output and rejects empty text", () => {
  const f = fixture(); f.media(); writeFileSync(f.output, "keep");
  expect(f.run("e2e-narrate.ts", [f.video, f.text, f.output]).code).not.toBe(0);
  expect(readFileSync(f.output, "utf8")).toBe("keep");
  writeFileSync(f.text, " ");
  expect(f.run("e2e-narrate.ts", [f.video, f.text, f.output + ".webm"]).err).toContain("text");
});

for (const failed of ["say", "ffprobe", "ffmpeg"]) test(`narration propagates ${failed} failure and cleans scratch files`, () => {
  const f = fixture(); f.media();
  f.tool("say", `import {writeFileSync} from 'node:fs';writeFileSync(process.argv[process.argv.indexOf('-o')+1],'audio')`);
  f.tool(failed, "console.error('tool failed'); process.exit(6)");
  const r = f.run("e2e-narrate.ts", [f.video, f.text, f.output]);
  expect(r.code).not.toBe(0); expect(r.err).toContain(failed);
  expect(existsSync(f.output)).toBe(false);
  expect(readdirSync(f.app).filter(n => n.startsWith(".web-qa-"))).toEqual([]);
});
