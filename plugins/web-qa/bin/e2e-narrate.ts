#!/usr/bin/env bun
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { destination, duration, main, publish, run, tool } from "./lib/runtime";

main(() => {
  const [videoArg, textArg, outputArg, ...extra] = process.argv.slice(2);
  if (!videoArg || !textArg || !outputArg || extra.length) throw new Error("Usage: e2e-narrate.ts <video> <text-file> <output.webm>");
  const video = resolve(videoArg);
  const text = resolve(textArg);
  if (!statSync(video).isFile()) throw new Error("Input video must be a file.");
  if (!readFileSync(text, "utf8").trim()) throw new Error("Narration text must not be empty.");
  const output = destination(outputArg);
  const encoder = tool("ffmpeg");
  const probe = tool("ffprobe");
  const say = Bun.which("say");
  const espeak = Bun.which("espeak");
  if (!say && !espeak) throw new Error("A local TTS engine (say or espeak) is required on PATH. Nothing was installed.");
  const engine = say ? "say" : "espeak";
  const scratch = mkdtempSync(join(dirname(output), ".web-qa-"));
  try {
    const audio = join(scratch, say ? "speech.aiff" : "speech.wav");
    run((say || espeak)!, say ? ["-f", text, "-o", audio] : ["-f", text, "-w", audio], engine);
    const seconds = duration(probe, video);
    if (duration(probe, audio) > seconds) throw new Error("Narration is longer than the video. Shorten the text or record a longer walkthrough.");
    const encoded = join(scratch, "narrated.webm");
    run(encoder, ["-nostdin", "-v", "error", "-i", video, "-i", audio, "-map", "0:v:0", "-map", "1:a:0", "-af", "apad", "-shortest", "-c:v", "copy", "-c:a", "libopus", encoded], "ffmpeg");
    duration(probe, encoded);
    publish(encoded, output);
    console.log(JSON.stringify({ output, engine, durationSeconds: seconds, bytes: statSync(output).size }));
  } finally { rmSync(scratch, { recursive: true, force: true }); }
});
