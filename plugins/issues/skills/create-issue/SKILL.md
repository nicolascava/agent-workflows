---
name: create-issue
description: "Capture one repository issue with a small, factual intake body."
argument-hint: '<problem> [repo=owner/repository] [project=owner/number]'
---
# Create an issue

Create one issue only on the user's request. Show the exact repository, title, body, assignees, dependency links, and proposed board changes before writing. A request to investigate or draft permits no mutation. Follow `${CLAUDE_PLUGIN_ROOT}/docs/safety.md` and `${CLAUDE_PLUGIN_ROOT}/docs/portable-instructions.md`.

Read `${CLAUDE_PLUGIN_ROOT}/docs/configuration.md`. Resolve the target with `"${CLAUDE_PLUGIN_ROOT}/bin/create-issue-project-resolver"`, using `--repo`, `--project`, or `--config` only when supplied or confirmed from this repository. Run from the repository root. Print its plain-issue fallback message when no board is available. Never infer a target from another checkout.

1. Read the user's facts, supplied links, repository guidance, and the relevant code only when needed. Keep one coherent problem. Ask for a missing target or material fact while continuing independent research. Do not invent root cause, acceptance criteria, owners, or project membership.
2. Write a short outcome-oriented title. Use a two to four sentence Problem, optional Steps to reproduce, Context, and Sources. Mark unknown context as Unknown. Preserve user proposals under Suggested solution as proposals. Demote headings in supplied fragments so they cannot create peer sections. The intake renderer `"${CLAUDE_PLUGIN_ROOT}/bin/print-pre-shaped-issue-body.ts" --input <json-file>` returns `{body}`. Its input is documented in `${CLAUDE_PLUGIN_ROOT}/docs/runtime.md`.
3. Include existing public attachment URLs as Markdown links. There is no attachment upload helper. Ask the user to upload a local attachment through GitHub if a link is required. Do not upload elsewhere or expose a local filesystem path in the issue.
4. If an explicit dependency is part of the request, verify both issue identities and the native blocked-by relation. A mention or sequence is not proof of a dependency. Do not create guessed dependencies.
5. Show the complete creation payload. Apply only the requested creation with `gh issue create --repo <owner/repository> --title <title> --body-file <file>`, adding confirmed assignees only when requested. Use a file for exact body bytes. Do not allocate issue types, priority, or other fields by guesswork.
6. Read the created issue back. Verify repository, title, body, and URL. Only then apply any separately previewed board membership and configured triage status. Resolve live field and option IDs first. An unavailable board leaves a plain issue and a clear receipt. On an uncertain create response, look for the created issue before considering another create.

Report the URL, what was applied, and what remains. Do not retry failed writes automatically. Do not run `/issues:triage` or assign implementation work without that request. For later refinement use `/issues:triage`, then `/issues:review-issue`.
