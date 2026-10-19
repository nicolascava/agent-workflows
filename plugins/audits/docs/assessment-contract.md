# Assessment contract

Use this contract for every audit and review in this plugin. Assessments read
evidence and report findings. They do not implement recommendations.

## Scope and evidence

State the requested subject, repository or file identifiers, included areas,
exclusions, and the questions the review can answer. Discover source locations,
commands, frameworks, and policies from the target repository. Do not impose
another repository's layout or workflow. Missing evidence is a limit, not a pass.

Bind code and configuration claims to full commit and tree OIDs or a verified
current worktree. Follow `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`.
Record dirty content hashes when reviewing local edits. For external evidence,
record its provider, query or node, time window, revision, retrieval time, and
pagination coverage. Separate source inspection from observed runtime behavior.
Mark stale, malformed, inaccessible, and unreviewed evidence explicitly.

## Read-only boundary

Default to a report in the conversation. Do not edit code, configuration, reports,
ignore rules, dependencies, snapshots, infrastructure, issues, comments, or other
external state. Do not install tools, read credential stores, or start services.
Do not execute repository scripts, tests, scanners, migrations, or fix commands
as part of a read-only assessment. Inspect existing outputs and script definitions.
The source helper's fetch writes Git metadata. It also requires the user's request
and a command and target preview as described in the source guide.
Use browser and design tools only when available, within the supplied scope, and
without actions that submit data or change application state.

Any requested write is a separate action. The user must request it. Show the
exact target and content or payload before writing. Report exports require a
user-chosen path; there is no default file location. If the request lacks a
destination, ask for one and keep the report in the conversation meanwhile.
An implementation suggestion does not authorize edits. Never chain into another
workflow that writes state. Repository checks need a separate user request and
their command and possible writes explained first.

## Severity and finding format

Use impact and reachability to choose severity. Keep confidence separate.

| Severity | Meaning |
| --- | --- |
| Critical | An evidenced path to widespread compromise, irreversible loss, or equivalent immediate harm. |
| High | A reachable defect with major security, integrity, availability, or user impact. |
| Medium | Material impact under limited conditions or a control gap with a plausible failure path. |
| Low | A bounded defect with modest impact or a small maintainability cost. |
| Informational | An observation or improvement without a demonstrated defect. |

Each finding includes an ID, title, severity, confidence, location, evidence,
trigger or failure path, impact, limitations, and a bounded recommendation.
Include a way to verify the finding and later verify a fix. Use line references
with their source revision, or external node and record identifiers. Redact
secrets and personal data. Keep an unproved hypothesis out of confirmed findings.
For existing accepted risks, record scope, owner role, rationale, and expiry when
available. Acceptance does not erase a finding or prove a control works.

## Verify findings

Trace each claim through the actual entry point, guards, data flow, and callers.
Check counterexamples, tests, repository policy, and compensating controls.
Distinguish a missing artifact from a broken control. Do not equate a text match,
scanner alert, generated explanation, or absent issue link with a verified defect.
Use existing test results only when their subject and freshness are known.
Recommend a safe reproduction when proving a claim would require an unauthorized
write or execution. Recheck the evidence boundary before the final report.
If it changes, refresh affected findings or mark their evidence incomplete.

Apply AI coverage where the subject uses agents or generated code. Inspect model
and tool inventory, prompt and data boundaries, tool authority, approvals,
identity, secrets, evaluations, traceability, generated-code review, dependency
provenance, rollback, and incident evidence. Do not invent AI requirements for a
subject that does not use it.

## Report shape

1. State the subject, evidence boundary, time, scope, exclusions, and method.
2. Summarize the most consequential supported results.
3. Present findings in severity order with evidence and verification guidance.
4. List coverage gaps, uncertainties, and bounded next steps. Say when no
   confirmed findings were found within the reviewed scope.
5. End with exactly one disposition: `complete`, `partial`, `blocked`, or
   `not-applicable`, and its reason.

`complete` means all applicable evidence in the declared scope was reviewed. It
does not mean defect-free. `partial` means some applicable evidence was unavailable
or excluded. `blocked` means a required evidence boundary could not be established.
`not-applicable` means the requested assessment has no applicable subject.
