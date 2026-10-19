# Simplicity doctrine

This document applies the `Simplicity with rigor` principle in [engineering doctrine](DOCTRINE.md), KISS and DRY, surface by surface. When you touch anything, whether prose, product scope, UI, database schemas, code, workflows, or your own plans and decisions, default to the simplest version that still meets the need and preserves rigor. Simpler means fewer moving parts, less to read, less to maintain, and a clearer path for the next person.

## Four principles

1. **Smallest useful abstraction (KISS).** Use the least structure that solves the real problem. Three plain lines beat a premature helper; inline single-use indirection. Add abstraction only when duplication or a second real caller demands it. Keep change sets minimal and blast radius small.
2. **Say it once (DRY).** State each rule, fact, and behavior in one place and link to it elsewhere. Remove duplication, dead code, unused options, and hedging words. One clear sentence beats three. Delete rather than deprecate-in-place when nothing depends on it.
3. **Fewest concepts.** Minimize what a person must hold in their head: screens, tables, columns, flags, states, endpoints, steps. Collapse overlapping ones instead of adding a new one next to them.
4. **Make it concrete.** Replace vague guidance with a rule someone can act on. A concrete default beats an abstract principle.

## By surface

- **Prose and docs:** shortest wording that keeps every idea; cut filler, merge overlapping sentences, lead with the point. See [technical-writing rules](content-writing-rules.md) for formatting specifics and `/core:condense` for the mechanical pass.
- **Product scope:** ship the smallest slice that delivers real user value; defer speculative flexibility until a second real need appears.
- **UI:** fewest screens, states, and controls that satisfy the flow; one accent, one clear action per view over five competing ones.
- **Database schema:** fewest tables and columns that model the real domain; avoid speculative nullable columns and unused join tables.
- **Code structure:** fewest files, layers, and indirections a reader must trace; prefer a direct call over a factory, strategy, or plugin system until a second implementation exists.
- **Workflows and process:** fewest steps and handoffs that still produce a correct, reviewable result; cut a step only if removing it does not remove a needed check.
- **Plans and decisions:** state the smallest decision that unblocks the next step; do not pre-decide questions that do not need answering yet.

## Guardrail

The [engineering doctrine](DOCTRINE.md) guardrail applies. Concretely: do not drop safety gates, tests, TDD discipline, boundary validation, required context, or production rigor in the name of "simpler." Necessary complexity that reflects a real constraint stays: make it clear, do not delete it. If a simplification would hide a real constraint, silently drop a safety check, or weaken a standard, stop and flag it instead of applying it.

`/core:condense` is the executable arm of this doctrine: it applies these principles mechanically to text, code, PR copy, schemas, UI surfaces, and workflow/decision write-ups. Frontend component work, module refactoring, and agent-context work defer their simplicity judgment call to this document instead of restating it.
