---
name: setup-ci
description: Generate or adapt GitHub Actions checks for a target repository's lint, typecheck, test, and build commands, with optional generic security scanners.
---

# Set up CI checks

Read `${CLAUDE_PLUGIN_ROOT}/docs/ci-checks.md`. This skill creates checks only.

1. Inspect repository guidance, manifests, lockfiles, workspace configuration,
   runtime declarations, and existing CI. Discover the app directory, package
   manager, install command, and lint, typecheck, test, and build commands. Ask
   when declarations conflict. Report missing checks without inventing scripts.
2. Adapt `${CLAUDE_PLUGIN_ROOT}/templates/checks.yml`. Select only needed entries
   from `${CLAUDE_PLUGIN_ROOT}/templates/runtime-steps.yml`. Preserve the pinned
   action commits. Use repository-declared versions and commands. Respect build
   prerequisites and workspace install boundaries.
3. If security scanning is requested, read
   `${CLAUDE_PLUGIN_ROOT}/templates/NOTICE.md` and
   `${CLAUDE_PLUGIN_ROOT}/templates/security-scanners.json`. Adapt
   `${CLAUDE_PLUGIN_ROOT}/templates/security-checks.yml` and
   `${CLAUDE_PLUGIN_ROOT}/templates/security-rules.yml`. Explain Docker, image
   downloads, advisory network access, report contents, and coverage limits.
4. Show the proposed workflow path and complete content before writing. For edits,
   include the patch and resulting content. Show any rules file the same way.
   Write only when the user's request covers that write. A preview request alone
   leaves files unwritten. Do not add release jobs or deployment integrations.
5. Parse YAML and check events, read-only permissions, working directories,
   command quoting, source action pins, and unresolved placeholders. Run focused
   local checks if dependencies and required services already exist. Never
   install packages or tools without the user's request and exact command preview.
6. Report changed files, discovered and omitted commands, optional scanners,
   action pins, local results, and any validation still requiring a CI run.
   Leave publishing, workflow dispatch, secrets, and repository settings to a
   separate explicit request.

`/core:verify` is optional when installed and requested. No other plugin is
required.
