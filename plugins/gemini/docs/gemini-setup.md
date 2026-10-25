# Gemini setup

The `/gemini:gemini` skill requires Google Antigravity CLI (`agy`), Bash, and jq.
Install the CLI yourself:

```sh
curl -fsSL https://antigravity.google/cli/install.sh | bash
```

The installer puts `agy` in `~/.local/bin/agy`. Make sure it is on PATH. Run
`agy` once in your terminal and sign in with Google. Tokens live in the system
keyring. There is no sign-in status command. `/logout` is an interactive slash
command. A failed research call that mentions sign-in, login, or authentication
means you must sign in and retry.

Calls use your Google account plan and its applicable limits or charges.
Installing this plugin does not include provider usage. Setting `modelProvider`
to `"gemini"` with `GEMINI_API_KEY` bills the Gemini API. The skill refuses any
non-null `modelProvider` and removes `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and
`GOOGLE_GENAI_USE_VERTEXAI` from the child environment. It never uses an API-key
fallback. List models with `agy models`. Select one through CLI configuration or
the skill's `--model` argument. The skill never hard-codes a model.

Before each run, the skill reads `~/.gemini/antigravity-cli/settings.json` with
jq if it exists. It stops if the file cannot be read or parsed, or if:

- `toolPermission` is `always-proceed` or `proceed-in-sandbox`.
- `permissions.allow` is a non-empty array, including rules like `command(<target>)`.
- `allowNonWorkspaceAccess` is true.
- `modelProvider` is non-null. A missing or null value is allowed.

The default `toolPermission` is `request-review`. `strict` is also supported.
Review settings yourself before retrying. The skill does not change them or
print other settings. `~/.gemini` also holds other Antigravity data. Do not
delete it to reset this integration.

The flow was verified with Antigravity CLI 1.4.7 on 2026-10-25. It requires
`--mode plan`, `--input-format stream-json`, `--output-format stream-json`,
and `--print-timeout 300s`. Plan mode is read-only
and supports `search_web` and `read_url_content`. Headless tools needing approval
are auto-denied, with a stderr notice. The run continues and may report `SUCCESS`
with an empty response. The skill treats an empty response as failure.

Plan mode needs slash command expansion. Never pass the flag that disables it,
since that silently disables plan mode. Keep the task template's first line
starting with `Question:`. The skill checks the first non-blank character and
stops if it is `/`, including after spaces, tabs, or newlines.

The skill starts in an empty private scratch working directory. This is not an
operating system sandbox. Review CLI configuration and external tools so they
cannot access files or repositories without approval. The prompt is sent as an
NDJSON user message through stdin. Send only public research context. Do not
include secrets or personal data. The result reports token usage and duration,
but does not report the model.

Google replaced Gemini CLI for free, Google AI Pro, and Google AI Ultra accounts
on 2026-06-18. These accounts can receive `IneligibleTierError` from the retired
CLI. See the [Google Developers Blog announcement, published 2026-05-19](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/).
The plugin keeps its `gemini` name and `/gemini:gemini` entry point.

The skill never installs tools, edits repository or user files, auto-approves
tools, uses API keys, or prints credentials. It writes only temporary task,
output, and status files, then removes them on success or failure. The CLI can
maintain its own session state. The skill never resumes conversations, enables
remote control, adds workspace directories, or changes CLI settings.

- [Headless mode](https://antigravity.google/docs/cli/headless/)
- [Execution modes](https://antigravity.google/docs/cli/modes/)
- [CLI reference](https://antigravity.google/docs/cli/reference/)
