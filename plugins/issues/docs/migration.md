# Migration inventory

The issues plugin requires core through its namespaced skills. Git-flow is optional. Runtime imports stay inside this plugin. All helpers use built-in modules. No runtime dependency installation is required. The manifest's existing author and repository fields are unchanged.

## Skills and assets

Paths in this table are relative to `skills/`. Each row ships `SKILL.md`. Tests use generic data rather than private fixtures.

| Skill | Other shipped skill files | Removed or rewritten |
| --- | --- | --- |
| acceptance-review | None. Shared evidence helpers live in lib and bin. | Removed private development links, repository expansion, support sync, launcher routing, and deployment assumptions. Folded five reference files into acceptance-evidence.md, acceptance-publication.md, and verification-source.md. Kept linked-PR evidence, independent challenge, actor exclusion, exact packet binding, and fresh final approval. |
| check-issue-status | None. | Replaced repository-specific verification commands with requested `/core:verify`. Removed private doc and launcher paths. Kept current-worktree delivery evidence, scenario status, immutable source, and a review gate before requested posting. |
| create-issue | helpers/print-pre-shaped-issue-body.ts and its adjacent test. | Dropped guard authorization tokens, private routing, and image uploading. Replaced the project resolver with repository-owned configuration. Kept public attachment URLs, intake facts, payload preview, and exact body readback. |
| github-waiting-replies | None. Shared scanner lives in lib and bin. | Removed default identity, repository scopes, and launcher invocation. Reimplemented bounded pagination, human-only latest signals, individual review requests, and incomplete-scan reporting. Team requests remain outside this scanner. |
| project | None. Shared hierarchy code lives in lib and bin. | Removed fixed boards, field IDs, type names, and launcher calls. Kept one-level native hierarchy, ordered edits, parent-only rollups, placement checks, and partial receipts. Sync and placement remain explicit skill procedures. The CLI only previews hierarchy edits. |
| review-issue | None. | Replaced private citations and routing with local docs and `/core:adversarial-review`. Kept structure-first review, full comment history, latest authorized decisions, stable findings, and bounded refresh after drift. |
| triage | helpers/issue-body-sections.ts, issue-body-writer-cli.ts, issue-structure-gate.ts, upsert-issue-rationale.ts, and an adjacent test for each. | Replaced fixed classifications and board options with live mappings. Replaced parser dependencies with a conservative section parser. Folded writing rules and the rationale template into issue-writing.md. Kept sizing, severity, priority seeding, required body sections, blockers, legacy readback, and refined-body gates. |

The old creation helper wrapper, resolver wrapper, and guard-token tests are replaced by direct entry-point tests and configuration tests. Upload helpers and their tests are omitted because plain `gh` has no general issue-attachment upload API. Existing public URLs can be included without uploading. The triage boundary tests are replaced by generic parser and writer behavior tests plus the repository leak scan. No private fixture corpus is shipped.

## Libraries

Each listed module has an adjacent `.test.ts` file.

| Module under lib | Shipped behavior |
| --- | --- |
| github-epic-board-context.ts | Operation-bound parent, direct-child, and board snapshot. |
| github-parent-project.ts | Fresh hierarchy reads and typed native mutation payloads. Attach forbids replacing a parent. |
| github-project-field-value.ts | Live text and single-select field resolution and typed clears. |
| github-read-cache.ts | Identity-bound memory cache for complete reads only. |
| github-target.ts | Safe repository, issue URL, issue number, and project reference parsing. |
| github-triage-board-read.ts | Paginated fields and membership with ambiguous or incomplete reads refused. |
| normalize-issue-body.ts | Conservative prose unwrapping that preserves structured content. |
| parent-project.ts | One-level edit plans, rank rollups, and authorized apply receipts. |
| set-issue-type.ts | Owner-native type discovery, plain-issue fallback, preview, and authorized readback. |
| configuration.ts | Repository settings, argument precedence, validation, and board degradation. |
| gh.ts | Injected provider runner, GraphQL error handling, and bounded cursor traversal. |
| workflow-mode.ts | Explicit supported delivery modes with no inferred default. |
| cli.ts | Strict value-flag parsing. |
| shaped-issue-gate.ts | Structural and direct-blocker checks plus logical priority seeding. |
| github-waiting-replies.ts | Read-only pending response signals and full supported pagination. |
| acceptance-review-gate.ts | Pinned evidence, criterion vocabulary, actor exclusion, conclusion, packet marker, and exact independent challenge checks. |

The generic libraries are minimal rewrites. Provider reads use an injected runner. No module consults a private registry or another plugin's files. Acceptance JSON checks consistency; it does not prove live identity, review provenance, or authorization.

## Executables

Nine entry points ship in `bin/`: `create-issue-project-resolver`, `print-pre-shaped-issue-body.ts`, `issue-structure-gate.ts`, `upsert-issue-rationale.ts`, `shaped-issue-gate.ts`, `parent-project.ts`, `github-waiting-replies.ts`, `acceptance-review-gate.ts`, and `verification-source.ts`. All have `#!/usr/bin/env bun` and executable mode. Tests are regular files. The attachment uploader is dropped for the reason above.

The source collector is a local copy of core's verification helper. Its temporary Git ref namespace belongs to issues. Its behavior tests use local bare repositories. Command helpers have subprocess tests for invalid arguments and a fake `gh` on PATH. The entry points do not perform GitHub mutations. Native type and hierarchy library writes require explicit authority from their caller.

## Documentation and guidance

Shipped docs are configuration.md, safety.md, workflow-modes.md, portable-instructions.md, issue-writing.md, parent-projects.md, verification-source.md, acceptance-evidence.md, acceptance-publication.md, runtime.md, and this inventory.

| Source citation | Replacement |
| --- | --- |
| D07 | Generic review and publication gates in safety.md and acceptance-publication.md. Private architecture context is omitted. |
| D11 | Plain writing in portable-instructions.md and issue-writing.md; requested copy work uses `/core:condense`. |
| D18 | Scenario status and evidence rules inline in check-issue-status. |
| D22 | Delivery source and publication controls inline in the relevant skills and local workflow docs. |
| D31 | Private helper index omitted. Installed entry points are documented in runtime.md. |
| D37 | Local verification-source.md and the vendored executable. |
| D62 | Generic coordination parent template in parent-projects.md. |

The three portable guidance sources are combined into portable-instructions.md. Their separate README and agent-instruction wrappers are dropped because they add no separate runtime behavior. References to unshipped skills and repository-specific operating context are removed. No other source documentation is copied.

## Test evidence

The migration used red tests before each implementation group, followed by green runs and targeted regressions. These counts record the runs when each group was introduced, not the final repository total.

| Group | Red evidence | Green evidence |
| --- | --- | --- |
| Initial library modules | 11 missing-module failures. | 36 passed, 99 assertions. |
| Verification runtime | 12 failures for the absent entry point. | Combined runtime, workflow, and library run: 49 passed, 189 assertions. |
| Owner type discovery and cache rejection | 2 failing behavior cases. | Library run: 38 passed, 105 assertions. |
| Skill helper modules | 9 missing-module failures. | Skill and library run: 55 passed, 172 assertions. |
| Rationale preservation and entry points | 3 failing behavior cases. | 11 passed, 61 assertions. |
| Exact packet and unfinished code fences | 2 failing behavior cases. | 8 passed, 26 assertions. |
| BOM placement | 1 failing behavior case. | 4 passed, 23 assertions. |
| Native no-reparent payload | 1 failing behavior case. | 3 passed, 6 assertions. |
| Explicit null and false configuration | 1 failing regression, also observed in the full suite. | 6 passed, 20 assertions. |
| Criterion vocabulary and oldest pending signal | 2 failing behavior cases. | 10 passed, 32 assertions. |

Provider tests inject responses or use a fake executable. Source tests fetch only local bare Git repositories. No test requires network access or changes provider state. See the task report for final foreground check results.

## Open questions and limits

The verification helper duplicates core and git-flow code to preserve installed-plugin isolation. Should a future release expose a versioned shared runtime contract? Until then, changes need coordinated copies and tests.

The section parser deliberately rejects ambiguous HTML and unfinished fences. It does not implement full Markdown syntax. Board snapshots refuse unsupported populated field values and more than 100 nested field values. Provider pagination has a 50-page limit. These cases stop visibly; supporting broader inputs would need additional parser or pagination work.

Team review requests are not resolved to memberships. Sync and placement have documented previews and readback requirements but no automatic apply command. Independent review and live acceptance provenance remain coordinator duties. No local gate can establish those facts from assertions alone.
