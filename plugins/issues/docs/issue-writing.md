# Issue contracts

An intake captures a single problem without pretending it is ready. Use Problem, optional Steps to reproduce, Context, optional Suggested solution, and Sources. Unknown context or sources may be explicit at intake. Preserve proposals as proposals. Existing attachment links are allowed. Local upload is not provided.

A new refined issue uses these exact peer headings:

```markdown
## Problem

The observed failure and the outcome that must change.

## Constraints

Observable requirements and relevant boundaries.

## No-gos

Specific behavior or scope that must remain excluded.

## Sources

Permalinks, paths, and decisions supporting the contract.
```

Optional Context, Steps to reproduce, Priority rationale, and Shaped by sections may add useful evidence. Each required section needs concrete content. If there are no special constraints or exclusions, state that conclusion explicitly and explain the reviewed boundary. Unknown, TBD, empty sections, and placeholder comments do not pass. Do not invent constraints to satisfy the gate.

Do not put a title, Solution, Suggested solution, implementation plan, or execution checklist in a new refined body. Put observable outcomes in Constraints and keep implementation choices available. A legacy Solution section may still define the acceptance contract when Constraints is absent. Readback mode recognizes that case. Refined mode never does. Preserve the legacy contract during review unless the user requests a replacement.

The dependency-free parser supports ATX and Setext headings, CRLF, a leading byte order mark, and matched backtick or tilde fences. It preserves exact source spans. It refuses HTML wrappers and unfinished fences rather than guessing at sections. It is not a general Markdown renderer. Rationale replacement accepts only one canonical `## Priority rationale` section of plain paragraphs. It refuses lists, tables, nested content, and near-match headings that could cause a destructive edit.

The structure gate requires one canonical level-two Problem, Constraints, No-gos, and Sources. It rejects title headings, smart quotes, verified tags, empty content, and new implementation sections. Draft mode reports an advisory 250 to 350 word target, excluding evidence-heavy Context, Steps to reproduce, and Sources sections. A warning does not block a useful shorter issue. Structural failures block. Refined mode checks the actual new body after publication.

## Classification and priority

Keep logical classifications separate from repository option names. Impact and effort use low, medium, and high judgments. Bugs also have SEV1 through SEV4 severity. The target configuration maps each judgment to live option names. Do not turn these logical labels into new board options or issue labels.

Seed only an empty priority:

| Effort / Impact | High | Medium | Low |
| --- | --- | --- | --- |
| Low | P0 | P1 | P2 |
| Medium | P1 | P2 | P3 |
| High | P2 | P3 | P4 |

Use configured priority ranks to map P0 through P4. Preserve existing priority unless its change was requested. Explain the causal impact and effort evidence in Priority rationale. Unknown estimates leave priority unset. A rationale-only edit must preserve every byte outside its section. Review the generated diff before writing.

Ready also requires a bounded deliverable, resolved decisions, complete required fields, no open or unknown direct blockers, and no critical or major review findings. A local structure pass alone is not readiness. Without a configured board, report the refined plain issue without claiming a Ready transition.
