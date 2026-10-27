---
name: codex
description: Delegate a bounded task to an installed Codex CLI signed in with ChatGPT. Use read-only access by default and report the session, final message, and verified evidence.
argument-hint: "[--write | --full-access] [--model <id>] [--resume <session-id>] <task>"
---

# Codex delegation

Use `/codex:codex` when the user requests Codex or when delegation helps with a
bounded task. Choose work that can be reviewed independently. Delegation is
optional. In a native Codex session, prefer the available delegation tools over
starting another CLI session.

Read `${CLAUDE_PLUGIN_ROOT}/docs/codex-setup.md` for requirements and optional
provider examples. Installing this Claude plugin does not configure Codex.

## Set the scope

Parse `--write`, `--full-access`, `--model`, and `--resume` separately from the
task text. Never evaluate task text as shell code. Agree on the repository, task,
acceptance criteria, and allowed commands from the user's request. Discover build
and test commands from that repository. Do not install tools as part of this skill.

The default sandbox is `read-only`. Use `approval_policy="never"` for every run.
Without `--write`, ask Codex to inspect and report. It may propose a patch in its
final message. It must not apply it.

`--write` selects `workspace-write`. Codex can write inside `WORKTREE`, `/tmp`,
and `$TMPDIR`, and nowhere else. In a linked Git worktree the Git directory sits
outside `WORKTREE`, so Codex can edit files but cannot commit. Claude commits.

`--full-access` selects `danger-full-access`. This disables the filesystem sandbox
and can expose files outside the repository and allow network access. State that
risk before launching. Use it only when the user explicitly asks for full access
and `workspace-write` cannot do the task. Never infer it from `--write`.

Use either write mode only when the user explicitly opts in. Keep the written
task within the authorized scope. This plugin ships no Codex command guards.
Write access does not authorize commits, pushes, publication, or account changes.
Existing Codex tools and command rules may have access beyond the shell sandbox.

## Resolve the CLI and check sign-in

Resolve a real executable. Shell functions and private launchers are unsuitable.
In Bash, use `type -P codex`. In zsh, use `whence -p codex`. Resolve relative
results against the current directory before changing directories. One fallback
candidate on macOS is
`/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex`.
Use it only if it exists and is executable. Otherwise report that the Codex CLI
must be installed and available on `PATH`. Never install it automatically.

Set `CODEX_BIN` to the resolved executable. Run this check before every launch:

```bash
AUTH=$(env -u OPENAI_API_KEY -u CODEX_API_KEY "$CODEX_BIN" \
  -c 'model_provider="openai"' -c 'forced_login_method="chatgpt"' login status 2>&1)
AUTH_STATUS=$?
if [ "$AUTH_STATUS" -ne 0 ] || [[ "$AUTH" != *"Logged in using ChatGPT"* ]]; then
  printf '%s\n' 'Codex requires ChatGPT sign-in. Run codex login in your terminal, then retry.' >&2
  exit 1
fi
```

Do not print credentials or request an API key. Do not use an API key as a
fallback. Keep the same environment removals and forced login setting on exec
and resume commands. Select the built-in OpenAI provider for these runs so a
custom provider cannot supply an API key from its own configuration.

## Check pace

Run `${CLAUDE_PLUGIN_ROOT}/bin/codex-pace.sh` once. It reports `under`, `ok`,
`over`, or `unknown` from local rate-limit records under
`${CODEX_HOME:-$HOME/.codex}`. It needs jq and reads at most 20 recent rollouts.
The format is advisory and may change with the CLI. Missing data is normal.
Share the line when useful. Pace never requires delegation or blocks a task.

## Prepare a task file

Choose an absolute `WORKTREE` path. Resolve the model from `--model` or the user's
CLI configuration. Set `MODEL` to that model identifier and retain it with the
session ID. If the effective model cannot be established, request a model before
launching. Do not substitute a fixed model from this skill.

Set `SANDBOX=read-only` by default, `SANDBOX=workspace-write` for `--write`, or
`SANDBOX=danger-full-access` for `--full-access`.
Use a private scratch directory and a quoted heredoc. Keep task text off argv.

```bash
umask 077
SCRATCH=$(mktemp -d "${TMPDIR:-/tmp}/codex-task.XXXXXX")
printf '%s\n' "$MODEL" > "$SCRATCH/model"
date +%s > "$SCRATCH/start-epoch"
git -C "$WORKTREE" rev-parse HEAD > "$SCRATCH/base-head"
cat > "$SCRATCH/task.txt" <<'TASK'
Task: replace this line with the bounded request.
Repository: describe the selected repository and relevant paths.
Allowed changes: list the authorized files, or say read-only.
Acceptance criteria: list concrete outcomes and discovered test commands.
Do not commit, push, publish, or change accounts unless the task authorizes it.
Report findings, changes, checks, unresolved risks, and the final result.
TASK
```

Include enough context for Codex to work without access to the conversation.
Record the initial status too. Preserve existing user changes.

## Launch and wait

Use the shell tool's background mode for the following block. Retain its tool
task ID. The outer shell waits for Codex and records its exit status. The PID
file lets the separate wait helper observe progress.
Carry the absolute paths and resolved values into each shell call. Shell
variables do not survive separate tool calls.

```bash
env -u OPENAI_API_KEY -u CODEX_API_KEY "$CODEX_BIN" exec \
  -m "$MODEL" -C "$WORKTREE" --sandbox "$SANDBOX" \
  -c 'approval_policy="never"' -c 'forced_login_method="chatgpt"' -c 'model_provider="openai"' \
  --json --output-last-message "$SCRATCH/final.txt" - \
  < "$SCRATCH/task.txt" > "$SCRATCH/events.jsonl" 2> "$SCRATCH/stderr.log" &
CODEX_PID=$!
printf '%s\n' "$CODEX_PID" > "$SCRATCH/pid"
wait "$CODEX_PID"
CODEX_STATUS=$?
printf '%s\n' "$CODEX_STATUS" > "$SCRATCH/exit-status"
```

In a separate foreground shell call, run:

```bash
"${CLAUDE_PLUGIN_ROOT}/bin/codex-wait.sh" "$SCRATCH/pid"
```

Give the tool enough time for a poll window of about nine minutes. The helper
allows up to ten seconds for a complete PID line, then polls 54 times at ten
second intervals. `CODEX_WAIT running` means repeat the foreground wait.
`done` means collect the original background task and its exit status. The helper
only probes the PID. It does not establish success or process identity.
`unknown` requires inspecting the background task and PID file.

Keep the turn open while the task runs. Use a finite task budget, with at most
six wait windows unless the user specifies another limit. If the budget expires,
cancel the tracked background task, wait for it to exit, and report the timeout.
Verify that its Codex child has exited too. If needed, stop that verified child
and collect the waiting shell's result before cleaning up orphans.
Never signal an unverified PID from a stale scratch file. Do not leave a run in
the background after reporting completion.

## Resume

For `--resume`, use the exact session ID and the original model retained from
that session. An explicit `--model` may override it. Do not silently use the
current default model. If the original model is unknown, request it from the
user before resuming. Never use `--last` to guess which session was intended.

Prepare a new scratch task file and retain the same launch, wait, and reporting
steps. Replace the exec invocation with this form. The sandbox setting is a
config override because resume has a different option set:

```bash
env -u OPENAI_API_KEY -u CODEX_API_KEY "$CODEX_BIN" exec \
  -m "$MODEL" -C "$WORKTREE" -c "sandbox_mode=\"$SANDBOX\"" \
  -c 'approval_policy="never"' -c 'forced_login_method="chatgpt"' -c 'model_provider="openai"' \
  --json --output-last-message "$SCRATCH/final.txt" \
  resume "$SESSION_ID" - < "$SCRATCH/task.txt" \
  > "$SCRATCH/events.jsonl" 2> "$SCRATCH/stderr.log" &
```

Immediately record `$!`, wait for that PID, and record its exit status as above.
Read-only remains the default for a resumed task. Prior write access does not
carry forward as consent for this task. Pass `--write` or `--full-access` again
to select `workspace-write` or `danger-full-access` for the resumed run.

## Reap leftovers

After collecting or cancelling the run, inspect orphan candidates:

```bash
CODEX_REAP_DRY_RUN=1 "${CLAUDE_PLUGIN_ROOT}/bin/codex-reap.sh" \
  "$WORKTREE" "$(cat "$SCRATCH/start-epoch")"
```

The reaper is macOS only. Other platforms emit `CODEX_REAP unknown: macOS only`.
It checks current-user orphans created since the recorded start. Both the process
and its top orphan ancestor must match the worktree by cwd or argv. It protects
the caller and its ancestors and checks process identity before each signal.
It sends TERM, then KILL after a short grace period.

This is a heuristic. A new unrelated orphan in the same worktree can also match.
Review the dry-run output, especially in a shared worktree. If every candidate
belongs to this task, run the same command without `CODEX_REAP_DRY_RUN=1`.
Otherwise stop only the verified task processes. Inspect and clean up tracked
task processes manually on other platforms. Report unresolved cleanup.

## Review and report

Extract the session ID from the `thread.started` event's `thread_id` using jq.
Read the final-message file, exit status, and relevant stderr. An absent final
message or nonzero exit status requires a failure report. Do not dump session
logs or treat a successful exit as proof that the task passed.

Codex output is evidence, not a verdict. Verify findings against the repository.
For writes, inspect status, diffs, and commits since the recorded base. Run the
checks that support the requested outcome. Distinguish Codex claims from checks
you verified. Report the session ID, model, sandbox, exit status, final message
or a faithful summary, changed files, verification, and remaining risks.
Remove scratch files after collecting the result unless the user needs them.
