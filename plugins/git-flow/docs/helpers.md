# Helper scope

All executable helpers use Bun and built-in modules. External commands are limited to `git` and `gh`; skill instructions may also use `jq`. Tests use temporary repositories, local bare remotes and a fake `gh` on `PATH`. They do not call the network.

| Helper | Reason |
| --- | --- |
| `workflow-mode.ts` | One schema, physical root, live base discovery and contributor prefix fallback across all skills |
| `verification-source.ts` | Race checks, immutable fetch binding, safe environment and cleanup are too easy to lose in repeated shell instructions; copied with tests from public core |
| `execute-test-plan.ts` | Markdown comments, variable-length fences, physical line numbers and byte-preserving checkbox updates need a parser; local files only |
| `check-pr-copy.ts` | Deterministic visible-description and reference checks avoid repeated regex instructions; local files only |

`execute-test-plan.ts show <body-file>` prints indexed items as JSON. `check <body-file> <index>` prints a candidate body to stdout and never edits its input or GitHub. Use a different output file, never redirect over the input. The skill controls source evidence and authorization before a single final PR edit.

The Markdown helpers are small public implementations. They retain relevant behavior cases from the source workflows without their private imports, identities, marker stores or network writers. The source script package declares ISC; no complete source helper or dependency closure from that package is shipped. Future verbatim ports need a license and attribution check. The verification helper is copied within this public MIT repository.

Branch normalization uses `git branch -m` only when requested, or `git switch -c` for new work. Landing uses the pinned `commit-tree` procedure in [landing.md](landing.md). Body repair edits local text. Issue references use canonical URLs without Development lookups. Copy review needs no persistent marker. These workflows do not need separate helpers for those operations.

Open question: replace the duplicated verification helper when Claude supports a reliable installed cross-plugin helper path. Until then, updates must run both copies' behavior tests.
