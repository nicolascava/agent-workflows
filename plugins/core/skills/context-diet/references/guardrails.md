# Guardrails

What this skill must never trade away, and the bookkeeping that turns an approved plan into a green build.

## Protected classes

Follow the simplicity doctrine already read by this skill and any existing repository rules. Remove accidental complexity, never essential complexity. These classes are out of scope for reduction regardless of size.

- **Safety gates and guard rules.** Anything that stops an irreversible or outward-facing action. Confirmation requirements, write guards, and permission boundaries stay in always-loaded context, because a rule that only loads when a workflow is invoked cannot protect a session that never invokes it.
- **TDD and verification requirements.** These bind every change, so they belong where every session sees them.
- **Provenance and evidence rules.** Requirements to cite sources or verify claims are the reason output can be trusted. They are always-loaded by necessity.
- **Anything the user has asked to keep.** Restate it in the findings as `keep` rather than dropping it silently from the table.

A surface in a protected class can still be trimmed for wording or relocated within always-loaded context. It cannot be moved behind an invocation, and it cannot be deleted to make a number smaller.

## The preservation matrix

Required before any edit that changes wording or location. One row per behavioral rule the plan touches:

| Rule | Current location | Proposed location | How the behavior survives | Owner |
| --- | --- | --- | --- | --- |

For unchanged text, record the move rather than restating the rule. Still verify reachability: hiding a skill can break automatic selection, and a reference file is useful only if the workflow explicitly reads it. There is no automatic reference-file expansion in this plugin. Spend the detail on deletions and rewording.

## Bookkeeping by lever

**Editing a governed document or skill:** discover and run existing validation, style, and budget checks. Keep em dashes out of prose. Update canonical sources and use a documented generator for derived files when one exists.

**Changing visibility:** use only a setting documented by the installed host. Verify typed invocation and any required automatic selection before and after. Do not assume a private override format is portable.

**Splitting a skill:** leave explicit reads through the skill root. Update existing content checks to cover the reference files. Verify every pointer and required gate remains reachable.

**Adding a skill:** measure its description and check existing host or repository limits. A local character ledger is not a model token budget.

**Retiring an agent or skill:** search the selected repository's existing skill, agent, and documentation paths with `rg` for references. Update authorized callers. Keep evidence of restoration and do not change global registries.

**Any change:** run discovered repository checks before reporting. A missing check is a stated limitation, never a fabricated pass.

## Reporting

Proof of work means numbers, not adjectives. Quote before and after character-count rows from the same scoped inventory, cite the invocation counts and the window that justified each cut, and state explicitly what was left on the table and why. A residual-risk section that says "none" on a plan that touched always-loaded rules has not been thought about.
