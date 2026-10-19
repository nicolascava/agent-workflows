import { afterEach, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cleanup, fixture } from "./lib/test-support";

afterEach(cleanup);

test("video prefers repo Playwright, isolates artifacts, preserves config and publishes chosen output", () => {
  const f = fixture(); f.media(); f.playwright();
  f.tool("playwright", "process.exit(90)");
  const before = readFileSync(f.config, "utf8");
  const r = f.run("e2e-video.ts", [f.config, f.output, "a spec.spec.ts"]);
  expect(r.code).toBe(0);
  expect(JSON.parse(r.out).durationSeconds).toBe(4.25);
  expect(readFileSync(f.output, "utf8")).toBe("encoded");
  expect(readFileSync(f.config, "utf8")).toBe(before);
  const { args, config } = f.calls()[0];
  expect(args).toContain("a spec.spec.ts");
  expect(config.webServer).toBeUndefined();
  expect(config.use.baseURL).toBe("http://example.test");
  expect(config.projects[0].use.locale).toBe("fr");
  expect(config.projects[0].use.video.mode).toBe("on");
  expect(config.projects[0].outputDir).not.toBe("existing-results");
  expect(readdirSync(f.app).filter(n => n.startsWith(".web-qa-"))).toEqual([]);
});

test("video accepts an available Playwright executable when no local one exists", () => {
  const f = fixture(); f.media(); f.playwright(false);
  expect(f.run("e2e-video.ts", [f.config, f.output]).code).toBe(0);
});

for (const missing of ["ffmpeg", "ffprobe", "Playwright"]) test(`video explains missing ${missing}`, () => {
  const f = fixture();
  if (missing !== "ffmpeg") f.tool("ffmpeg", "process.exit(0)");
  if (missing !== "ffprobe") f.tool("ffprobe", "console.log(4)");
  if (missing !== "Playwright") f.playwright();
  const r = f.run("e2e-video.ts", [f.config, f.output]);
  expect(r.code).not.toBe(0);
  expect(r.err).toContain(missing);
  expect(existsSync(f.output)).toBe(false);
});

for (const [flag, message] of [["TEST_PLAYWRIGHT_FAIL", "Playwright"], ["TEST_NO_VIDEO", "No recordings"], ["TEST_FFMPEG_FAIL", "ffmpeg"]]) {
  test(`video fails closed for ${flag} and cleans scratch files`, () => {
    const f = fixture(); f.media(); f.playwright();
    const r = f.run("e2e-video.ts", [f.config, f.output], { [flag]: "1" });
    expect(r.code).not.toBe(0); expect(r.err).toContain(message);
    expect(existsSync(f.output)).toBe(false);
    expect(readdirSync(f.app).filter(n => n.startsWith(".web-qa-"))).toEqual([]);
  });
}

test("video refuses an existing destination", () => {
  const f = fixture(); f.media(); f.playwright(); writeFileSync(f.output, "keep");
  expect(f.run("e2e-video.ts", [f.config, f.output]).code).not.toBe(0);
  expect(readFileSync(f.output, "utf8")).toBe("keep");
});

test("video rejects invalid probe duration before publishing", () => {
  const f = fixture(); f.media(); f.playwright();
  const r = f.run("e2e-video.ts", [f.config, f.output], { TEST_DURATION: "not-a-number" });
  expect(r.code).not.toBe(0); expect(r.err).toContain("duration");
  expect(existsSync(f.output)).toBe(false);
});
