---
name: walkthrough-video
description: Create a focused product walkthrough video with a curated browser scenario and optional local narration. Use when the user requests a demo or guided screen recording.
disable-model-invocation: true
---

# Record a walkthrough

Read `${CLAUDE_PLUGIN_ROOT}/docs/browser-workflow.md` and
`${CLAUDE_PLUGIN_ROOT}/docs/video-tools.md`.

1. Identify the audience, task, starting state, and intended outcome. Discover the
   app, commands, running URL, and installed browser tooling. Ask for a user-chosen
   output path. Keep the story to one useful task with a clear beginning and end.
2. Outline scenes with the action and visible result. Use realistic generic test
   data and repository authentication fixtures. Avoid personal data and live
   destructive actions. If narration is requested, obtain supplied or approved
   text and a separate chosen narrated output path.
3. Prefer one curated Playwright test with one page for a continuous story. Use
   semantic test steps and observable readiness checks. Allow deliberate reading
   pauses only for presentation pacing. Do not replace assertions with sleeps.
   Preview any proposed test or config files before requested writes. Keep them
   separate from required CI suites unless the user asks to include them.
4. Reuse the server and record through `/web-qa:e2e-video`. The helpers are
   `${CLAUDE_PLUGIN_ROOT}/bin/e2e-init.ts`,
   `${CLAUDE_PLUGIN_ROOT}/bin/e2e-video.ts`, and
   `${CLAUDE_PLUGIN_ROOT}/bin/e2e-narrate.ts`. They need local tools, install
   nothing, and refuse existing destinations. An available browser tool may be
   used if Playwright is absent and that tool supports video.
5. Review the silent recording before narration. Check framing, pacing, readable
   states, action continuity, and the final outcome. The narrator starts one text
   track at the beginning. Fit the text to the video and listen to the result.
   Use a longer recording or shorter text if speech exceeds the video length.
6. Report the scene outline, test and recording results, output paths, duration,
   tool limits, playback checks, and cleanup. Stop only servers you started and
   close only your browser contexts. Upload or publish only when requested.
