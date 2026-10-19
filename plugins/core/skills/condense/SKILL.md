---
name: condense
description: Tighten text, code, PR copy, schemas, UI, or workflows without losing meaning; simplicity doctrine.
argument-hint: '"[--code|--pr|--schema|--surface|--workflow] [title=\"<TITLE>\" bodyFile=\"<path>\"] <file-path or paste content>"'
---
# Condense

Tighten content while preserving meaning. Six modes: text (default), code (`--code`), PR (`--pr`), schema (`--schema`), surface (`--surface`), and workflow (`--workflow`). Text, code, and PR modes are deterministic tightening passes. Schema, surface, and workflow modes apply the shared simplicity doctrine (`${CLAUDE_PLUGIN_ROOT}/docs/simplicity-doctrine.md`) with judgment, and always require user confirmation before applying a cut that could lose data, remove a UI state, or weaken a gate.

Apply the technical-writing rules in `${CLAUDE_PLUGIN_ROOT}/docs/content-writing-rules.md` to every generated response.

## Arguments

- `<file-path>` (optional): path to the file to condense. If omitted, the user pastes or describes the content.
- `--code` (optional): force code mode.
- `--pr` (optional): PR mode: simplify a PR title and body.
- `title="<TITLE>"` (optional, PR mode only): PR title supplied by the caller; if omitted, fetched from `gh pr view`.
- `bodyFile="<path>"` (optional, PR mode only): path to a file containing the PR body, supplied by the caller; if omitted, fetched from `gh pr view`.

## Mode selection

Route to a mode as follows:

- `--pr`, `--code`, `--schema`, `--surface`, and `--workflow` are mutually exclusive; pass at most one.
- `--pr` → **PR mode** (see below).
- `--code` → **Code mode** (see below).
- `--schema` → **Schema mode** (see below).
- `--surface` → **Surface mode** (see below).
- `--workflow` → **Workflow mode** (see below).
- File path with a code extension (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.py`, `.go`, `.rb`, `.rs`, `.sh`, `.sql`, `.tf`, `.css`) → **Code mode** automatically.
- Content that is entirely a single fenced code block → **Code mode** automatically.
- Everything else (`.md`, plain prose, pasted text) → **Text mode**.

## Text Mode

### Process

1. **Read the content.** If a file path is provided, read it. Otherwise use the content the user provided.

2. **Pass 1: structure.** Cut at the sentence and paragraph level first; one dropped sentence beats ten trimmed words:
   - Drop whole sentences whose idea is already fully stated by a neighbor.
   - Merge sentences that genuinely overlap. Two sentences making different points stay separate.
   - Lead with the point: if an opener delays the main idea, cut it so the first sentence carries the message. Every distinct idea must survive this pass. A sentence may be removed only when its idea remains elsewhere.

3. **Pass 2: words.** Within the surviving sentences, cut:
   - Filler and weak qualifiers ("really", "actually", "just", "very", "probably", "basically").
   - Redundant phrases (e.g., "I genuinely hope" → "I hope") and phrases reducible to one word ("in order to" → "to").
   - Adjectives and adverbs that don't add meaning.

4. **Hold the line on voice.** Across both passes:
   - Preserve the author's voice, rhythm, and tone. Keep line and paragraph breaks unless merging makes it tighter.
   - Do not add new words, ideas, or transitions that weren't in the original.
   - Do not rephrase for "polish." If the original phrasing is rough but authentic, keep it rough.

5. **Present the result.** Show the condensed version as a Markdown `>` blockquote per "Formatting" in `${CLAUDE_PLUGIN_ROOT}/docs/content-writing-rules.md`. State the word count reduction (e.g., "142 -> 98 words, cut 31%").

6. **Update the source file** if one was provided, after the user approves.

### Rules

1. Never change the author's voice. If it sounds different after condensing, you cut too much or rephrased too aggressively.
2. Never add content. Only remove or merge.
3. Show the before/after word count so the user can gauge the cut.
4. Do not judge tightness before the structural pass. If, after the structural pass, less than 10% could be cut, say so and suggest leaving it as-is.

## Code Mode

Simplify source code without changing its observable behavior. Write directly to disk only when the task authorizes source edits. The user reviews the diff with `git diff`. Preserve unrelated work.

Read `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md` before code-dependent work. Use the intended current worktree only. Read `AGENTS.md`, `CLAUDE.md`, contribution guidance, and `git-workflow.json` only if present. Discover the package manager and required test, build, typecheck, and lint commands from package scripts, lockfiles, a Makefile, or CI configuration. Do not require a particular workflow mode.

Confirm the target repository, configured remote, and comparison branch. From that worktree, run `"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base>`; add `--remote <configured-name>` when needed. Require exit 0 and well-formed ready evidence. The live worktree, including uncommitted changes, is the subject. Use the freshly fetched full `baseOid` for comparisons. Block on missing or ambiguous evidence. Never substitute another checkout, a symbolic ref, or a cache. This is not clean default-branch evidence.

### Process

1. **Confirm file state.** If the target file has uncommitted edits (`git status`), stop unless the user already authorized working with those edits. Record the starting diff.

2. **Locate covering tests.** Discover covering tests and their commands from the target repository. If coverage is absent, add characterization tests through `/core:tdd` before refactoring, within the approved scope.

3. **Run the baseline.** Run tests before touching the file. If the baseline is red, abort; you can't tell a regression apart from a pre-existing failure.

4. **Apply cuts in-place** per the categories in Rules below: dead code, premature abstraction, what-comments, task/caller refs, impossible-case guards, backwards-compat shims, and verbose idioms not covered by the repository linter.

5. **Re-run tests and the discovered typecheck and other required gates.** On regression, revert only this pass's edits, preserving pre-existing work, and report the failure.

6. **Report metrics.** Lines before/after, percent cut, tests green, typecheck and other required checks reported.

### Rules

1. **Preserve behavior.** Observable output to callers and tests must not change.
2. **Cuts only.** Never add features, abstractions, helpers, or "polish" rewrites.
3. **Three similar lines is better than a premature abstraction.** Inline single-use helpers; do not extract new ones.
4. **Trust internal code.** Don't add error handling, fallbacks, or validation for scenarios that can't happen. Only validate at system boundaries (user input, external APIs, filesystem, network).
5. **Default to no comments.** Keep a comment only when *why* is non-obvious: hidden constraint, subtle invariant, workaround for a specific bug, surprising behavior.
6. **No task/PR/caller refs in comments.** Strip `// used by X`, `// added for Y`, `// fixes #123`.
7. **No backwards-compat shims.** If something is unused, delete it completely rather than leaving a placeholder.
8. **Remove dead code**: unused exports, unused functions, unreachable branches.
9. **Remove verbose idioms not covered by the repository linter**: `if (x === true)` → `if (x)`, needless ternaries-as-assignment. Don't duplicate rules already enforced by `prefer-const`, `prefer-template`, `no-useless-*`, `func-style`, `max-len`.

**Output:** a short unified diff summary and the metrics line. The file is written directly to disk.

## PR Mode

When `--pr` is passed, apply these rules on top of the standard condense pass. Read the target repository's PR template only if present. Preserve required sections; otherwise use Summary and Test plan as below. Read-only metadata lookup is allowed; publication needs explicit authority.

A caller receives the JSON below and decides whether to apply it within its own authorized scope.

**Title rules:**
- ≤ 72 characters
- Imperative mood: first word must be a verb (Add, Fix, Update, Refactor, etc.)
- No conventional-commit prefix (`feat:`, `fix:`, `chore:`, etc.); delete the prefix and capitalize the rest
- No issue IDs (`#123`); remove them
- No em dashes or double dashes; use a comma instead
- No smart/curly quotes; use straight quotes
- Double quotes for quotation: prefer `"double quotes"` over `'single quotes'` for quoted phrases; single quotes only when nesting inside double quotes; contractions and possessives exempt
- No trailing period
- Wrap file names, route paths, and package names in backticks

**Body rules:**
- Without a repository template, use two sections: `## Summary` (1-3 bullets) then `## Test plan` (checkbox list). An infrastructure-as-code PR keeps its `## Plan output` and `## Rollback` sections after the test plan.
- Each Summary bullet: one short plain sentence covering what changed and why, about 60 words across the Summary. Describe behavior, not implementation; prefer everyday words over code names, and keep a code name only when the reader must type or search for it. No hedging ("consider", "perhaps", "maybe", "you may want to"), no filler ("really", "just", "very"), no throat-clearing
- Test plan items: one line each, concrete and observable (a command, an endpoint, a visible behavior)
- No em dashes in any section
- Do not add generated attribution or coauthor footers
- Preserve exact issue, PR, repository, and branch reference targets. Do not invent links or silently alter scope.
- Do not add issue-closing language unless explicitly authorized. Use a non-closing related reference otherwise.

**Output:** JSON only, no prose. Return a JSON object with these optional keys:

```json
{
  "rewriteTitle": "<new title: omit if unchanged>",
  "rewriteBody": "<full new body markdown: omit if unchanged>",
  "summary": "<one sentence describing the cuts>"
}
```

### Standalone invocation

When `/core:condense --pr` is run directly:

1. Resolve the exact repository and PR. Read its title, body, URL, author, and head with `gh pr view` using only needed JSON fields. If no open PR exists for the intended target, report that and stop. Ambiguity blocks the action.
2. Apply the full PR transform. Return the proposed JSON. Invocation alone does not authorize an external write.
3. Apply metadata only if the user explicitly authorized those fields on that exact PR. Resolve the authenticated viewer and live PR author first. Another author's PR needs explicit authority covering that ownership boundary. Re-read the original fields and head immediately before editing; drift requires a fresh proposal.
4. Use only changed flags with `gh pr edit`. Pass exact title text as one quoted argument. Write exact body text to a unique temporary file without shell interpolation and pass it with `--body-file`. Do not execute content as shell code. Clean up only that temporary file. A no-op needs no write.
5. Report the changed fields and verified PR URL, or the unchanged proposal and any blocker. Do not create a PR, comment, approval, or issue as a side effect.

## Schema Mode

When `--schema` is passed, apply the simplicity doctrine (`${CLAUDE_PLUGIN_ROOT}/docs/simplicity-doctrine.md`) to a database schema or data model (SQL DDL, a schema file, or an entity-relationship description).

### Process

1. **Read the schema.** If a file path is provided, read it (for example a schema source file or a `.sql` migration). Otherwise use the content the user provided.
2. **Find removable structure.** Flag: unused tables and columns (grep call sites and query usage first), speculative nullable columns with no current writer, join tables that could collapse into a foreign key, and duplicated fields that belong in one place.
3. **Propose, do not silently drop.** Schema cuts can lose data or break a caller. Present the proposed removals and their call-site evidence; apply only after the user confirms.
4. **Preserve constraints.** Never remove a `NOT NULL`, foreign key, or unique constraint that enforces a real invariant just to make the schema "simpler." That is essential complexity; keep it.

**Output:** a list of proposed cuts with call-site evidence, applied only after confirmation.

## Surface Mode

When `--surface` is passed, apply the simplicity doctrine to a UI surface, feature scope, or product flow (a component tree, a page, or a described flow).

### Process

1. **Read the surface.** Read the component file(s) or the described flow.
2. **Find removable structure.** Flag: screens or steps that duplicate a decision already made elsewhere, controls with no current use, states that collapse into an existing one, and competing visual emphases.
3. **Propose, do not silently drop.** UX cuts affect real users. Present the proposed simplification and the user value it preserves; apply only after the user confirms.
4. **Preserve required states.** Never remove a loading, error, empty, or permission-denied state to make a flow "simpler." Those are essential complexity.

**Output:** a short before/after description of the flow and the proposed cuts, applied only after confirmation.

## Workflow Mode

When `--workflow` is passed, apply the simplicity doctrine to a process, workflow doc, or plan (e.g. a section of `AGENTS.md`, a skill, or a `docs/plans/*.md` file).

### Process

1. **Read the workflow.** Read the target file or section.
2. **Find removable structure.** Flag: steps that duplicate a check performed elsewhere, handoffs with no distinct owner or purpose, and decisions restated in multiple places instead of pointed at one source.
3. **Preserve gates.** Never remove a safety gate, approval step, review checkpoint, or test/verification step to make a workflow "simpler." Those are essential complexity; the doctrine's guardrail applies here most.
4. **Propose, do not silently drop.** Present the proposed cuts and which rule now points at which source; apply only after the user confirms for canonical or safety-relevant docs.

**Output:** a short list of proposed cuts and consolidations, applied only after confirmation.
