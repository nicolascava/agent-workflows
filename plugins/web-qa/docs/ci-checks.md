# Checks-only CI

Discover the application directory, workspace boundaries, package manager,
lockfile, runtime versions, install command, and lint, typecheck, test, and build
commands. Read existing workflows and repository guidance first. Reuse the exact
commands the repository declares. Do not invent a missing script or runtime
version. Resolve conflicting declarations with the user. Report absent checks.
Do not replace a working workflow wholesale when a focused edit suffices.

Start from `${CLAUDE_PLUGIN_ROOT}/templates/checks.yml`. Replace every `__TOKEN__`
with reviewed repository values. Remove a check only if it does not exist, and
report the gap. Order checks around actual build prerequisites. Select needed
runtime steps from `${CLAUDE_PLUGIN_ROOT}/templates/runtime-steps.yml`. Runtime
versions come from repository declarations. A package manager may need its own
repository-documented setup command after runtime setup. This template does not
choose a manager or install command for the target.

Use a repository-relative working directory that exists. Some repositories
install at the workspace root and check from an app directory. In that case,
give the install step its own working directory. Keep multiline commands in YAML
block scalars. Preserve quoting inside shell commands. Do not insert untrusted
pull request titles, branch names, or body text into shell source.

Keep triggers appropriate to repository checks. The base template uses
`pull_request` and `merge_group`, read-only contents permissions, concurrency
cancellation, no checkout credentials, and bounded job time. It performs checks
only. Avoid secrets in untrusted pull request jobs. Do not use privileged pull
request execution, automatic commits, or repository write permissions.

## Pinned actions

These pins are fixed template inputs. Keep them unchanged when adapting the
template. Do not invent a replacement action version. If the repository requires
another integration, discuss that separately from this template.

| Action | Version | Commit |
| --- | --- | --- |
| actions/checkout | v4.3.1 | `34e114876b0b11c390a56381ad16ebd13914f8d5` |
| actions/setup-node | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| oven-sh/setup-bun | v2.0.1 | `4bc04d37a750122a420985ada21198f5743458b5` |
| actions/upload-artifact | v4.6.2 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |

## Optional security checks

Offer `${CLAUDE_PLUGIN_ROOT}/templates/security-checks.yml` only when requested.
Read `${CLAUDE_PLUGIN_ROOT}/templates/NOTICE.md` and
`${CLAUDE_PLUGIN_ROOT}/templates/security-scanners.json` before adoption. Preview
all workflow and rules paths and content. Copy
`${CLAUDE_PLUGIN_ROOT}/templates/security-rules.yml` to the target's selected
rules location and adjust the workflow mount to match.

The optional workflow scans the full checked-out source for secrets, selected
static patterns, and dependency vulnerabilities. It needs Docker on the CI
runner. Images are pulled by digest during CI; advisory queries can use the
network. Explain that behavior before the workflow write. This skill does not
run or download scanners locally. Findings and tool failures fail their steps;
later scanner steps and evidence upload still run unless cancelled. Missing
lockfiles and unsupported languages limit coverage. There is no differential
baseline or private report normalizer.

Review evidence for sensitive content before enabling upload. The secret scanner
redacts findings; other reports may contain paths, snippets, and dependency
names. Scope retention and artifact access to repository policy. The two local
static rules are deliberately limited and do not establish a security verdict.
Do not silently suppress scanner errors or replace failed reports with empty
success data.

## Write and verification

Show the exact destination, normally a chosen file under `.github/workflows/`,
and the full rendered content before writing. For an existing file, show the
intended patch and resulting content. The user's request to set up CI must cover
the write. If it covers only advice or a preview, leave the files unwritten.
Do not ask for a second approval when the write is already requested and the
preview matches that request.

Check YAML parsing, action pins, event structure, permissions, paths, and that no
placeholders remain. Run discovered checks locally only when they do not install
dependencies or require unrequested services or data changes. Installation needs
the user's request and exact command preview first. Distinguish local check
results from an actual CI run. Do not push, trigger a workflow, edit branch
protection, or configure repository secrets unless separately requested.
