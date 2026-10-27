# Codex setup

The `/codex:codex` skill requires an installed Codex CLI signed in with ChatGPT.
It also uses Bash, git, and jq. The CLI must support `exec --json`,
`--output-last-message`, `exec resume`, and the configuration settings below.
The macOS ChatGPT app bundle is one possible CLI location. A CLI on `PATH` also
works. The skill resolves the executable and checks `codex login status`.
If sign-in is missing, run `codex login` yourself and select ChatGPT sign-in.
API keys are not used by this skill.

Installing the Claude plugin adds its skill and helpers. It does not change
Codex configuration, install Codex, or copy provider files. The plugin has no
Codex hooks. Provider examples are optional and require manual review and copying.

## Optional configuration

Codex uses `${CODEX_HOME:-$HOME/.codex}` for its user configuration directory.
Back up an existing `config.toml` before editing it. Read
`${CLAUDE_PLUGIN_ROOT}/examples/codex/config.toml` and merge the settings you want
into that file. If no configuration exists, you can copy the example by hand.
Do not overwrite existing settings without reviewing them.

The example contains three settings:

| Setting | Effect |
| --- | --- |
| `sandbox_mode = "read-only"` | Starts shell execution with read-only filesystem access. |
| `approval_policy = "never"` | Prevents interactive approval requests. Commands that require approval may fail. |
| `forced_login_method = "chatgpt"` | Requires ChatGPT authentication. |

The example selects no model, account, project, or external tool server. Select
a model supported by your CLI and account through your own configuration or the
skill's `--model` argument. The skill retains that model for explicit resumes.
Review configuration layers, command rules, and external tools before relying
on a sandbox boundary. These settings do not restrict independently configured
external tools. The skill also supplies the approval and login settings on each
launch and removes API-key environment variables from that child process.
It selects the built-in OpenAI provider for those runs. Custom providers that
require API keys are outside this skill's sign-in flow.

## Optional command rules

Read `${CLAUDE_PLUGIN_ROOT}/examples/codex/rules/git-safety.rules` before use.
To enable it, create `rules/` under your Codex configuration directory and copy
the file there. Give it a distinct filename and review other loaded rule files.
Codex loads rule files according to its configuration layers and trust settings.
Claude plugin installation does not load this file.

The rules allow these command prefixes:

- `git add` and `git status`.
- `gh issue` and `gh pr` followed by `view`, `list`, `diff`, `checks`, or `status`.
- `gh run view`, `gh run list`, and `gh run watch`.

An `allow` decision can permit a command outside the sandbox without prompting.
Use these examples only if that access is acceptable. `git add` changes the index.
The rules grant no user authorization to stage or publish work. They do not block
every other command. Unmatched commands follow the rest of your Codex policy.
Some combinations in a shared prefix list may be unsupported by gh and will fail.

Do not broaden these to all Git or gh commands. Options on apparently read-only
Git commands can write files, invoke external programs, or run hooks. Commits,
branch changes, fetches, merges, API calls, and workflow mutations need separate
review. The example's `match` and `not_match` entries check prefix scope. They
do not test command effects. Review arguments and repository configuration too.

If your CLI supports it, inspect a decision before enabling the file:

```bash
codex execpolicy check --rules ./git-safety.rules -- git status --short
```

Run that command in the directory where you copied the example. Execution rules
are experimental. Check the installed CLI's help and current documentation.

## Helpers

`${CLAUDE_PLUGIN_ROOT}/bin/codex-pace.sh` reads local rate-limit records. Its
single output line is advisory. It does not call Codex or choose who does a task.
Missing jq, records, or a weekly window produce `CODEX_PACE unknown`.

`${CLAUDE_PLUGIN_ROOT}/bin/codex-wait.sh` accepts a PID file. It waits for a full
numeric PID line, then probes for about nine minutes. It prints `done`, `running`,
or `unknown` with a `CODEX_WAIT` prefix. It never signals the process. PID reuse
can make a probe inconclusive. Collect the tracked background task for its result.

`${CLAUDE_PLUGIN_ROOT}/bin/codex-reap.sh` accepts an absolute worktree path and
the run's start epoch. It uses macOS process tools. Other platforms return an
`unknown` line. Set `CODEX_REAP_DRY_RUN=1` to list candidates first. The helper
matches recent current-user orphans by worktree cwd or argv, including their top
orphan ancestor. It protects its caller and checks identity before signals.
Matching does not prove task ownership. Review candidates in shared worktrees.
Approved candidates receive TERM, then KILL if still alive after the grace period.

Read-only delegation is the default. The skill's explicit `--write` option uses
`workspace-write`, which limits writes to the worktree, `/tmp`, and `$TMPDIR`.
In a linked Git worktree, Codex cannot commit because the Git directory is
outside the writable roots. The separate `--full-access` option uses
`danger-full-access`, which removes the filesystem sandbox and can allow network
access. Neither option provides repository guard hooks. Review the task and
these risks before opting in. Writes still need verification after the run.

## References

- [Codex CLI reference](https://developers.openai.com/codex/cli/reference/)
- [Codex configuration reference](https://developers.openai.com/codex/config-reference/)
- [Codex execution rules](https://developers.openai.com/codex/rules/)
