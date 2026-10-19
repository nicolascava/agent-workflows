# Runtime helpers

All executables use Bun from PATH. Libraries use built-in modules only. There is no runtime installation step. `gh` is needed for provider reads or explicitly requested writes. Git is needed for source evidence. Each entry point rejects unknown, duplicate, empty, and missing-value flags. Errors exit nonzero. JSON outputs are data for the coordinator, not permission to mutate.

| Entry point under bin | Input | Behavior |
| --- | --- | --- |
| create-issue-project-resolver | Optional `--repo`, `--project`, `--config` | Read-only repository/board resolution with plain-issue fallback. |
| print-pre-shaped-issue-body.ts | `--input <json>` | Return `{body}` for intake. |
| issue-structure-gate.ts | `--body-file <file> --mode draft\|readback\|refined` | Return structural errors, advisory warnings, and word count. Fail exits nonzero. |
| upsert-issue-rationale.ts | `--body-file <file> --rationale-file <file> --out <file>` | Write an inspected local draft without changing the source body. |
| shaped-issue-gate.ts | `--input <json>` | Check body and fresh blocker evidence for a Ready decision. |
| parent-project.ts | `--input <json>` | Read fresh hierarchy and print show data or ordered native payloads. Never apply. |
| github-waiting-replies.ts | `--repo <comma-separated-repositories> --user <login>` | Read pending response signals. Report incomplete scopes. |
| acceptance-review-gate.ts | `--input <envelope-json>` | Check exact acceptance packet, comment, and independent challenge consistency. |
| verification-source.ts | `--base <branch> [--remote <name>]` | Collect fresh current-worktree and fetched-base identity. |

Intake input is `{problem, context?, sources?: string[], stepsToReproduce?, suggestedSolution?}`. Problem is required. Missing Context and Sources become Unknown. Fragment headings are demoted. This is intake only, not a ready contract.

Shaped-gate input is `{body, boardAvailable, blocked, blockers: [{state}]}`. `blocked` includes unresolved decisions. Every direct blocker must have native `state: CLOSED`. Unknown state blocks. The coordinator must separately check all configured required fields, classification, sizing, and independent issue review. The gate accepts the legacy readback contract; new refinements must also pass structure mode refined.

Parent input is `{operation: "show"|"attach"|"detach"|"reorder", parentId, childIds?: string[]}` using live issue node IDs. The CLI returns `{plan, payloads, applied: false}` for edits. It offers no apply flag. Sync and placement are documented skill procedures. Field readers and rollup planners are in `lib`; they are not hidden schedulers.

The rationale writer validates UTF-8 and refuses source/output aliases, hard links, symlink outputs, and nonregular files. Once valid arguments reach the writer, a failed transformation removes stale output. Invalid CLI arguments exit before any file operation. It preserves BOM and CRLF. Section parsing refuses unsupported HTML and unfinished fences. Rationale editing is narrower than full Markdown editing. The body normalizer unwraps conservative prose only and preserves code, tables, hard breaks, and line ending style. It does not rewrite repository commands or terminology.

GitHub calls use an injected runner in tests and an argv-based `gh` subprocess in production. No shell evaluates provider arguments. Subprocesses have a deadline. Cursor and REST reads cap at 50 pages of 100 nodes. Repeated cursors, partial GraphQL errors, missing pages, and ambiguous membership fail visibly. Nested project item field values beyond 100 fail closed rather than appear blank. Only text and single-select values are consumed. Unsupported populated field types may block a snapshot; no affected value is silently cleared.

The read cache is memory-only and bound to an identity, query, variables, and TTL. Mutations, failures, and partial GraphQL errors are never cached. Use zero TTL or direct reads for mutation preflight. No credential or provider response cache is persisted. Parent board contexts belong to one operation and must never be reused as a later preflight.

Waiting replies reads explicit repositories only. It covers individual review requests, latest external human mentions, decision requests on authored items, and unresolved external-last review threads. Team review requests are excluded. It ignores bots, minimized comments, quoted lines, and code. Each scope carries errors; partial results never imply an all-clear. Since provider data can change during a scan, the report is a bounded point-in-time listing.

Acceptance gate assertions need independent provenance and live checks. See [acceptance evidence](acceptance-evidence.md). No helper supplies mutation authority. A write callback in the hierarchy library requires an explicit authority flag and returns a partial receipt on failure. Native issue type writes default to preview and require an explicit authorized call plus readback.
