---
name: context-diet
description: Audit and trim agent config, memory, and skills to cut context cost while preserving behavior.
argument-hint: "(optional) focus area - \"agents-md\", \"skills\", \"agents\", \"memory\", or omit for full audit"
---
# Context diet

Run a context-size audit first, read-only by default. Apply edits only after the user approves a concrete plan and behavior-rule preservation matrix. Honor approval already given for that concrete scope. Use the current worktree. Read `${CLAUDE_PLUGIN_ROOT}/docs/simplicity-doctrine.md`: fewer concepts and less to load, without dropping behavior.

Measure rather than guess. Size is a cost signal, not a reason to delete. Usage counts help explain value, but a missing invocation in a limited window does not prove a surface is obsolete.

## Source-of-truth map

Read `AGENTS.md`, `CLAUDE.md`, contribution guidance, and repository configuration only if present. Discover existing repository-local skill and agent directories. Follow documented source and generated-file relationships; do not assume a particular runtime layout or workflow mode. Never hand-edit generated output.

Scope the audit to selected repository files and explicitly supplied evidence. Do not walk home directories, other checkouts, historical stores, or memory databases. A configured memory interface is optional; absent access is a limitation, not a reason to inspect its backing store.

## Workflow

1. **Measure current state.** Inventory the full selected scope with bounded `rg --files --hidden` queries. Exclude generated, vendored, and historical directories according to the target repository. Record every selected file before measuring; a largest-files sample is not a baseline. Run `wc -m` on quoted paths for character counts. Measure model-visible descriptions separately from skill bodies. Quote the counts and command scope, and state which surfaces the installed host actually loads. Report unknown visibility or limits as unknown. Do not invent caps, framing costs, or token totals from character counts.

   Read `${CLAUDE_SKILL_DIR}/references/surfaces.md` for loading distinctions and measurement limits. Read only the files needed for the selected audit. Use repository budget checks only if present and discover their commands from package scripts, a Makefile, or CI configuration.

2. **Gather usage evidence.** Use only explicitly supplied or authorized usage records. State the repository, observation window, coverage, and counting method. Count skill calls, agent calls, and typed commands separately with bounded `rg` queries and `wc -l` where their format permits. Do not search local session stores by default. If records are unavailable, report usage as unknown and do not infer zero use. Hidden skills with typed invocations may be working as intended. Token and compaction metrics require actual host telemetry; file counts cannot supply them.

3. **Audit source placement and rank by reversibility.** Check whether each rule belongs in always-loaded agent instructions, an invoked skill, a reference file loaded on demand, a generated file, or policy-governed memory. Use the repository's documented canonical sources and leave generated output alone. Rank every candidate by how cheaply it can be undone, then by yield, and propose the reversible ones first.

   Read `${CLAUDE_SKILL_DIR}/references/levers.md` for the catalog of proven levers, the evidence each one requires, and the counter or guard each one forces you to update.

   Read `${CLAUDE_SKILL_DIR}/references/guardrails.md` before deciding what goes in the table. Safety gates, TDD and verification requirements, and provenance rules are out of scope for reduction regardless of what they cost, so a candidate in a protected class never becomes a proposal.

4. **Audit memory with governed cleanup, if available and in scope.** Read the configured authoritative source first. Use only the configured memory interface as supplementary context. Before approval, list opaque record IDs and reasons, without payloads or sensitive values. Delete only the approved records through that interface and capture payload-free status evidence. Never inspect the backing store. If no such interface is configured, mark this step unavailable and continue the file audit.

5. **Present findings.** Use this table and wait for approval:

   | Category | Surface | Current behavior | Proposed destination | Expected char delta | Evidence | Reversibility | Risk |
   | --- | --- | --- | --- | --- | --- | --- | --- |

   Categories: hide, split, delete, consolidate, trim, relocate, or keep. Every row needs a measured character delta and named evidence. A row whose evidence is only "this file is large" is not ready to propose.

6. **Build a behavior-rule preservation matrix before applying edits.** Map every behavioral rule affected by the plan from its current location to the proposed location, with the preservation rationale and owner. For visibility or reference-file moves, verify that discovery and required reads still preserve behavior. Unchanged text alone does not prove reachability. Rows that delete or reword a rule need the full mapping. Do not make changes until the user approves the matrix. Apply the bookkeeping checklist in `${CLAUDE_SKILL_DIR}/references/guardrails.md`, already read in step 3, to every approved row.

7. **Apply approved changes.** Use `/core:tdd` where production behavior can change. Keep protected rules always available. Update existing reference checks, generated outputs through their documented generator, and budget checks only where the repository has them. Discover commands rather than requiring a private synchronization tool. Do not change global runtime settings without explicit authority.

8. **Verify and report.** Include required check results, command summaries, before/after `wc -m` counts, memory deletion status when applicable, and residual risks. Re-run the same complete inventory and measurements. Quote before/after ledger rows. Run discovered repository checks; report unavailable checks as incomplete. Use `/core:skill-review` for an authorized skill audit and `/core:review` when the approved implementation scope needs code review. Neither performs delivery.

## Rules

- Preserve behavior. Relocate or consolidate rules only when the matrix shows where the behavior survives.
- Prefer trimming always-loaded context before invoked skills, and prefer hiding or splitting before deleting.
- No cut without evidence. Cite an invocation count, a measured character delta, or a duplicated rule.
- Keep changes minimal and scoped to the approved files.
- If the worktree changes under you, adapt without reverting unrelated edits.
