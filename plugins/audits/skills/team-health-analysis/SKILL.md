---
name: team-health-analysis
description: Analyze aggregate delivery and collaboration signals from Git and optional GitHub history of the current repository or explicitly named repositories. Use for evidence-based process questions with clear time windows and limits.
argument-hint: "[--repos <name=path> ...] [--months <count>] [--bucket <week|month>]"
---

# Team health analysis

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

## Scope the history

Use the current repository unless `--repos name=path [name=path ...]` names the
repositories in scope; then use exactly those, each under its given name. Identify
each source boundary with `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`.
Record each repository's full subject commit OID, verified as a commit in that
repository, plus branch history selection and any shallow history limit. Derive each configured
GitHub repository from its local repository and confirm ambiguity with the user.
Keep each repository's evidence, gaps, and metrics separate; combine them only as
labeled totals. Do not search other repositories, contributor profiles, private
contributor records, calendars, or external spreadsheets.

Use the user's time window and bucket size. Interpret `--months` as a positive
integer and `--bucket` as `week` or `month`; reject other values. If unspecified,
use the last three completed calendar months in weekly buckets. State exact start
and end timestamps, time zone, and bucket boundaries. Use the same window for each source.

## Collect aggregate signals

Read Git history at the pinned OID. Count changes and active periods with an
explicit merge and bot policy. Distinguish authored time, committed time, and
integration time. File churn can identify areas to inspect; it is not productivity.

If GitHub read tools or `gh` are available, query only the in-scope repositories'
pull requests, reviews, and check history. Obtain access only through the
platform's authorized credential mechanism, never by reading tokens from files or
the environment; without it, treat GitHub evidence as unavailable. Use read
operations only. Record queries, retrieval time, pagination, filters, and
incomplete permissions. Never modify issues, pull requests, labels, comments, or repository settings.
If GitHub evidence is unavailable, continue with a Git-only result and name the
missing coverage. Git timestamps alone do not establish review latency, deployment
frequency, production quality, or end-to-end cycle time.

Measure aggregate PR throughput, size distribution, time to first review, time to
merge, aging open work, and check reliability only when the required events exist.
Define each metric, denominator, sample size, and exclusions. Keep still-open work
visible; do not count it as completed or zero-duration. Avoid double-counting
review events or merge commits. Separate human and automated events where known.
For small samples, favor counts and ranges over confident percentile trends.

## Interpret and report

Report repository-level patterns by default. Do not rank or score individuals.
Per-person analysis requires an explicit user request and remains limited to
the in-scope repositories' history with clear caveats. Do not infer wellbeing,
working hours, competence, causation, or individual output from commits, lines, or AI use.

Use the contract's report shape. Include the evidence window, metric definitions,
aggregate tables, gaps, plausible explanations, and bounded process experiments.
Distinguish an observed bottleneck from a hypothesis. Keep recommendations tied
to the evidence. Do not export a spreadsheet, create issues, or publish a report
unless requested with a target and exact content preview first.
