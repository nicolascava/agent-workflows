# Grok setup

The `/grok:grok` skill requires the official `@xai-official/grok` package from
the npm publisher `xai-security`, Bash, and jq. Install the CLI yourself:

```sh
npm install -g @xai-official/grok
```

Run `grok login` yourself for browser sign-in. Use `grok login --device-auth` on
a headless machine. The CLI caches the token. There is no documented sign-in
status command for this flow. A failed research call that mentions login means
you must sign in and retry.

Calls use your signed-in subscription and its applicable limits or charges.
`XAI_API_KEY` takes precedence over subscription sign-in and bills the API. The
skill removes it from the child environment and never uses an API-key fallback.
Select a model through CLI configuration or the skill's `--model` argument.

The CLI must support `--prompt-file`, `--permission-mode plan`,
`--output-format json`, `--cwd`, and `--no-auto-update`. The skill runs in plan
mode, which is read-only, from an empty private scratch working directory. This
is not an operating system sandbox. Review CLI configuration and external tools
so they cannot access files or repositories.

The prompt is read from a private file, not argv. Send only public research
context. Do not include secrets or personal data. Each call reports its cost.

The skill never installs tools, edits repository or user files, auto-approves
tools, uses API keys, or prints credentials. It writes only temporary task,
output, and status files, then removes them. The CLI can maintain its own session
state. The skill does not resume sessions or change CLI settings, and it disables
automatic updates.

- [Official Grok CLI package](https://www.npmjs.com/package/@xai-official/grok)
