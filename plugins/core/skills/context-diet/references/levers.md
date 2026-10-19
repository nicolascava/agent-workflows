# Reduction levers

Reduction levers, ordered by how cheaply a mistake can be undone. Propose tier 1 before tier 2, and tier 2 before tier 3. A smaller saving that can be reverted with one line is worth more than a larger one that cannot, because the cost of being wrong is what makes context reduction risky.

Each lever names the evidence it requires. A proposal without that evidence is not ready, however obvious the saving looks.

## Tier 1: reversible placement and visibility changes

These keep the text, but still need reachability checks. Prefer changes that can be restored with a small diff.

### Hide a skill from the model listing

Use only a visibility setting documented by the installed host. Verify the skill remains invocable and does not depend on automatic selection. Do not invent a private settings schema or assume a flag has the same meaning across hosts.

*Evidence required:* no automatic invocations over a stated, adequately covered window, plus proof that the workflow does not need automatic discovery. Typed invocations can support keeping a skill available explicitly. Missing telemetry is unknown, not zero.

*Bookkeeping:* measure the visible description change and run any existing budget check. Verify invocation after the change.

### Retire an agent from active discovery

Use the repository's documented mechanism, if present. Keep a recoverable definition. Moving a file alone is not proof that the host stopped discovering it.

*Evidence required:* covered usage records and a caller search showing no required workflow depends on the agent. Check delegated calls as well as direct calls when records include them.

*Bookkeeping:* update existing contract tests and authorized references. Do not retire an agent still required by a skill.

### Split a skill body into reference files

Move step bodies into `references/*.md` and leave explicit reads through the skill root. Preserve the text and verify each read occurs before its rules are needed. This plugin does not splice reference files automatically.

*Evidence required:* measured upfront body reduction, with all behavior still reachable. No unused-usage claim is needed for an unchanged text move.

*Bookkeeping:* update any existing content checks to read the relevant files. Keep assertions about `SKILL.md` itself on that file.

### Disable an unused tool server

Only propose this when the installed host documents its loading behavior. Settings changes need explicit authority. An unavailable server is a reliability problem as well as a possible context cost.

*Evidence required:* actual status and tool-call evidence over a stated window. Do not infer zero tool use from skill-only records.

*Bookkeeping:* state whether the change affects repository configuration or a separate authorized setting. Do not change either during the read-only audit.

## Tier 2: recoverable

The text changes, so reverting means restoring wording rather than flipping a flag. Diff review carries the weight here.

### Trim a model-visible description

Visible descriptions can load before invocation; verify the installed host's behavior. Cut them to the trigger conditions a reader needs to choose the surface, not a summary of what it does. Use a concise trigger description. Apply only documented host or repository limits.

*Evidence required:* quote the measured description count and compare relevant peers. Check that the shorter description still distinguishes the surface. A description that prevents correct selection is a regression regardless of size.

### Relocate a rule out of always-loaded context

Move a rule that only matters inside one workflow from `AGENTS.md` into the skill that needs it, or into a `docs/` page that the skill reads. The rule still binds, but only where it applies.

*Evidence required:* the rule is genuinely scoped to that workflow. A rule that any session might need belongs in always-loaded context regardless of its size.

*Bookkeeping:* update existing references and run discovered repository checks. Keep required rules always available.

### Deduplicate a rule stated in two places

The same rule in `AGENTS.md` and `CLAUDE.md` costs twice and drifts. Keep one statement and point at it.

*Evidence required:* quote both copies. Confirm they say the same thing, because near-duplicates often encode a real distinction.

## Tier 3: irreversible in effect

Deletions. The text is recoverable from history, but the knowledge that it mattered is not, and nobody re-reads history before writing a rule. Reach for these only when a tier 1 or tier 2 lever cannot achieve the same thing.

### Delete a rule, a skill, or an agent

*Evidence required:* zero invocations is not sufficient on its own. Local transcripts cover local sessions only, so absence of use is absence of evidence. Deletion needs a positive argument that the surface is obsolete: the workflow it served is gone, the tool it wrapped is retired, or another surface now covers it. Prefer a reversible trial where discovery and safety still hold. Silence alone is not proof of obsolescence.

### Delete a memory record

Follow step 4 of the workflow exactly. Read the configured authoritative source first, list the opaque record IDs and reasons before approval, and capture payload-free evidence afterwards.

*Evidence required:* the record is stale or contradicted by the authoritative source. Never delete a record merely because it is old.

## Session-behavior levers

Use explicitly supplied host telemetry over a stated window before proposing these changes. Without that evidence, report them as unmeasured opportunities.

- **Compaction threshold:** compare main per-call median and p90 context with the first-call median and top-session compaction counts before lowering the threshold.
- **Output bounding:** use carried tool-result tokens by tool to identify commands whose output needs smaller fields or ranges.
- **Screenshots as text:** use carried browser-tool tokens to identify candidates for text reads; confirm the actual tool results and host measurement. Do not assign a universal image token charge.
- **Session scope:** use top-session token totals, call counts, and compaction counts to find long sessions that could benefit from a fresh session for unrelated requests.

## Anti-levers

Reductions that look like savings and are not.

- **Trimming a skill body that is rarely invoked.** It costs nothing until it runs. Effort here buys almost no per-session saving and risks dropping a step.
- **Shortening prose in always-loaded files by compressing sentences.** Fewer characters, same number of concepts, worse comprehension. The simplicity doctrine asks for fewer concepts, not denser wording.
- **Hiding a skill the model needs to discover on its own.** If the model cannot select it without being told, hiding it removes the capability in practice even though typed invocation still works. Check whether the skill's value depends on unprompted selection.
- **Raising a budget fraction to clear a failing check.** That converts a signal into silence. Reduce the surface, or make the case for the new ceiling explicitly.
