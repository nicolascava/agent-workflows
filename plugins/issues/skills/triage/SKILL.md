---
name: triage
description: "Classify, size, and refine an issue into a bounded, reviewable problem."
argument-hint: '<issue number or URL> [repo=owner/repository]'
---
# Triage an issue

Read `${CLAUDE_PLUGIN_ROOT}/docs/safety.md`, `${CLAUDE_PLUGIN_ROOT}/docs/configuration.md`, and `${CLAUDE_PLUGIN_ROOT}/docs/issue-writing.md`. Mutate bodies, types, fields, status, dependencies, or assignments only on the user's request. Show the full proposed payload before each group of writes. A classification report alone is read-only.

Read the whole issue, every comment page, current native type, parent, direct blockers, and live board state. Resolve target identity and configuration through `"${CLAUDE_PLUGIN_ROOT}/bin/create-issue-project-resolver"`. Gather linked source facts. Cite precise paths, symbols, and permalinks. Label assumptions and missing evidence. Refresh before writing. Do not reuse an earlier board snapshot for a new operation.

## Classify and size

Classify the problem as a bug, feature, or task. Map that logical type to the repository's configured native issue type. Discover native types from the owner organization. If types are unavailable, retain a plain issue and explain. Do not create labels or replace an existing type without explicit authority.

Assess impact and effort separately as low, medium, or high. Impact measures users affected, frequency, and consequence. Low is a small inconvenience, medium is a material workflow loss, and high is a core workflow failure or broad loss. Effort includes implementation, uncertainty, validation, and review. Low is a small localized change, medium crosses a few known boundaries, and high has broad scope or unresolved design. Leave uncertain fields unset and state what would resolve them.

For bugs, assess severity separately: SEV1 is outage, data loss, or a critical security failure; SEV2 is a major failure without a usable workaround; SEV3 is degraded behavior with a workaround; SEV4 is minor friction. These are logical classifications. Write only configured board options.

Seed an empty priority from the matrix in `${CLAUDE_PLUGIN_ROOT}/docs/issue-writing.md`. Preserve an existing priority unless the user asks to change it. Explain the impact and effort evidence in a short Priority rationale. Map logical ranks to repository options. Missing mappings block that field write, not the plain issue.

A ready issue must fit one agent session plus review. Split an oversized outcome into independent deliverable children with explicit boundaries. Use `/issues:project` for a one-level coordination parent when requested. Do not infer blockers from child order.

## Refine and gate

Use canonical Problem, Constraints, No-gos, and Sources sections. Optional Context and Steps to reproduce carry evidence. Remove implementation prescriptions from the new shaped contract. Translate a useful proposal into outcome constraints only when supported. Record unresolved decisions rather than deciding scope silently. Preserve legacy contracts under the read rules in `${CLAUDE_PLUGIN_ROOT}/docs/issue-writing.md`.

Write the draft to a file. Run `"${CLAUDE_PLUGIN_ROOT}/bin/issue-structure-gate.ts" --body-file <draft> --mode draft`. A fail blocks publication; a warn is advisory. Aim for 250 to 350 useful words without padding. For a rationale-only edit use `"${CLAUDE_PLUGIN_ROOT}/bin/upsert-issue-rationale.ts" --body-file <current> --rationale-file <prose> --out <draft>`. It refuses ambiguous or destructive replacements. Inspect the diff.

Show body bytes, native type, every old and new field, dependency edits, and assignments before applying the requested changes. Preflight all live field IDs and options. Read each write back. Run the structure gate with `--mode refined` against the actual body after a new refinement. Stop on mismatch and report partial completion.

Only intake or configured triage/ready items may be refined in place under this workflow. For building, review, acceptance, shipped, or unknown states, report findings and seek explicit scope before changing the contract. Without a board, refine the plain issue when requested and explain that no Ready transition is available.

Before a Ready move, complete `/issues:review-issue`, resolve critical and major findings, and verify classification, sizing, all required configured fields, direct blockers, and unresolved decisions. Run `"${CLAUDE_PLUGIN_ROOT}/bin/shaped-issue-gate.ts" --input <json-file>` against fresh readback evidence. Any open or unknown direct blocker, blocked decision, malformed body, or missing board prevents Ready. Never clear a blocker by changing a label alone. A readiness request authorizes only its previewed status change. Do not assign work automatically.
