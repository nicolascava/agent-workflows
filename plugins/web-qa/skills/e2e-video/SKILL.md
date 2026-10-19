---
name: e2e-video
description: Record selected browser tests into a local WebM video with installed Playwright and media tools. Use when the user requests a test recording.
disable-model-invocation: true
---

# Record browser tests

Read `${CLAUDE_PLUGIN_ROOT}/docs/browser-workflow.md` and
`${CLAUDE_PLUGIN_ROOT}/docs/video-tools.md`.

1. Discover the app, test configuration, installed Playwright, configured browser,
   and running URL. Ask for the output path and scenario selection if absent.
   ffmpeg and ffprobe must be available. Do not install anything without the
   user's request and an exact command preview.
2. Inspect setup hooks and test data mutations. Reuse the running server. The
   recording helper disables configured server management, but setup hooks remain
   active. Use an existing focused test when possible. If new tests or config are
   needed, show the proposed paths and content before requested writes.
3. If no config exists, preview one with
   `bun "${CLAUDE_PLUGIN_ROOT}/bin/e2e-init.ts" "<running-url>" "<test-directory>"`.
   This prints content only. Do not overwrite an existing config.
4. Record with
   `bun "${CLAUDE_PLUGIN_ROOT}/bin/e2e-video.ts" "<config-path>" "<chosen-output.webm>" "<spec-filter>"`.
   Use the helper's documented limits. A failed test remains a failure. If
   Playwright is absent, use an available browser tool only if it supports video,
   save to the chosen path, and describe the different capture method.
5. Probe and inspect the output. Check framing, transitions, visible actions,
   private data exposure, and duration. For requested narration use a supplied
   text file and
   `bun "${CLAUDE_PLUGIN_ROOT}/bin/e2e-narrate.ts" "<video.webm>" "<supplied-text-file>" "<chosen-narrated-output.webm>"`.
   Without a working local voice, keep the silent recording and state the gap.
6. Stop task-owned servers and close task-owned browser contexts. Report the exact
   command, selected tests, test result, clip count, duration, output paths,
   playback review, and limitations. Do not publish or upload the video unless
   requested.
