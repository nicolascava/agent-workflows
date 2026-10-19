# Local video tools

These scripts require Bun. Recording also requires an installed Playwright CLI,
its configured browser, ffmpeg, and ffprobe. Narration requires ffmpeg, ffprobe,
and a detected local `say` or `espeak` executable. Nothing installs packages,
browsers, voices, or models. Inspect the target configuration and hooks before
execution. Follow `${CLAUDE_PLUGIN_ROOT}/docs/browser-workflow.md` for servers,
permissions, data, and cleanup.

Run commands from the discovered application directory. Replace angle-bracket
arguments with discovered values or user-chosen paths. Quote each argument.
Output parents must exist. Video destinations must end in `.webm` and must not
exist. The scripts publish without overwriting and clean their scratch files on
success or a handled failure. A forced process kill can prevent cleanup.

## Configuration preview

```sh
bun "${CLAUDE_PLUGIN_ROOT}/bin/e2e-init.ts" "<running-url>" "<test-directory>"
```

This prints a minimal Playwright config to stdout. It writes nothing. Use it
only if no suitable configuration exists. Preview the chosen path and full
content before a requested config write. It contains no server command. Test
specs, fixtures, authentication, and data setup remain repository-owned.

## Recording

```sh
bun "${CLAUDE_PLUGIN_ROOT}/bin/e2e-video.ts" "<config-path>" "<chosen-output.webm>" "<spec-filter>"
```

The spec filter is optional. Filters cannot start with a dash. Configure project
selection in the reviewed config if needed. The helper prefers the nearest
repository Playwright executable, then one already on PATH. It creates a sibling
temporary config, keeps repository options, disables configured `webServer`, and
forces video on with a 1920 by 1080 viewport and video size. It uses one worker,
zero retries, isolated output directories, and a line reporter. Other setup and
teardown hooks still run. Review them for server and data mutations first.

Only videos from this run are joined, in sorted artifact-path order. Multiple
tests or contexts can produce several clips. This ordering is not a timed story.
Use one curated test and one page for a continuous walkthrough. Tests must close
their contexts so Playwright can finish saving recordings. A failed test or
missing recording fails the command. The helper does not hide failures to salvage
a video. ffmpeg joins compatible Playwright WebM recordings without re-encoding.
An incompatible clip fails with the encoder error.

The JSON result contains output path, clip count, duration in seconds, and bytes.
Inspect the delivered video in an available player. Report unavailable playback
as a limit. A successful encoder or probe is not visual QA. Each external command
has a five-minute limit. Use a narrower test selection if recording exceeds it.

## Optional narration

```sh
bun "${CLAUDE_PLUGIN_ROOT}/bin/e2e-narrate.ts" "<video.webm>" "<supplied-text-file>" "<chosen-narrated-output.webm>"
```

Use text supplied or approved by the user. The helper detects `say`, then
`espeak`, synthesizes locally, and adds one narration track from the start of the
video. It replaces any original audio in the new file. The original video stays
intact. The local voice and language come from the detected engine's defaults.
If speech exceeds the video duration, the helper stops. Shorten the text or record
a longer walkthrough. It pads shorter speech with silence and keeps the video
length. It does not provide per-scene timing or a remote speech service.

The JSON result contains output path, engine, duration, and bytes. Listen to the
result and check pacing, pronunciation, clipping, and alignment with the screen.
If a local voice is unavailable, deliver the silent recording and state the gap.
