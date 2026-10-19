---
name: tdd
description: "Red-green-refactor for every code change: no production code before a failing test."
argument-hint: "<feature or bug description> | <legacy plan file name or path>"
---
# TDD workflow

Read `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md` before code-dependent work. Use the intended current worktree only. Read `AGENTS.md`, `CLAUDE.md`, contribution guidance, and `git-workflow.json` only if present. Discover the package manager and required test, build, typecheck, and lint commands from package scripts, lockfiles, a Makefile, or CI configuration. Do not require a particular workflow mode.

Confirm the target repository, configured remote, and comparison branch. From that worktree, run `"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base>`; add `--remote <configured-name>` when needed. Require exit 0 and well-formed ready evidence. The live worktree, including uncommitted changes, is the subject. Use the freshly fetched full `baseOid` for comparisons. Block on missing or ambiguous evidence. Never substitute another checkout, a symbolic ref, or a cache. This is not clean default-branch evidence.

**Iron law: No production code without a failing test first.** If implementation code is written before a failing test exists, remove that premature implementation and start over with the test. Preserve unrelated and pre-existing work. This applies to every implementation task.

## Mode dispatch

- **Plan mode:** the argument resolves to a user-supplied existing plan file. Read it as reference only. Never edit, check off, or replace it.
- **Single-task mode:** the argument is a feature or bug description. Run the strict cycle below.

If no argument is given, ask whether the user wants a plan or a single task. Do not search private stores or historical directories for a plan.

## Single-task mode

1. **Confirm scope:** Verify the current worktree and approved task before code or test writes. Follow existing branch guidance if present. Do not impose a branch naming scheme or workflow mode. Verify required commands before production edits; missing or unverifiable required commands block the task.
2. **Red:** Write failing tests that describe the expected behavior. Run the discovered test command and confirm failure. Verify the expected reason: missing behavior or a wrong result. An unrelated import, typo, or syntax error proves nothing; fix the test first. Enumerate edge cases and boundary conditions up front and test them now.
3. **Green:** Implement the minimum code to make the tests pass. Nothing more. Run the same test command and confirm all relevant tests pass.
4. **Refactor:** Simplify only with the suite green. Preserve behavior and run the same tests after each change.
5. **Build and typecheck:** Run the discovered required commands. Fix errors. Some type errors surface only during build.
6. **Lint:** Run the discovered lint command and resolve its failures. State unsupported checks explicitly; do not mark them passed.
7. **Proactive quality gate:** Run the gate below on the diff. Fix critical/major blockers with concrete failure scenarios; defer minor/nitpick findings under `/core:adversarial-review` triage. Add missing edge-case tests red-green before committing.
8. **Commit when authorized:** Commit the passing implementation with tests using an imperative message and any required repository convention. Otherwise present the diff and evidence. Do not mutate trackers or external state without explicit authority.

## Plan mode

Automated, batched execution using a read-only plan as reference, with review checkpoints between batches. Report progress in the conversation rather than changing the plan.

1. **Load plan:** Read the specified file and review it critically. Raise unclear or risky requirements before starting. Do not edit it.
2. **Confirm scope and worktree:** Follow repository guidance if present. Check conflicts only in an explicitly configured and authorized source; an absent tracker never requires a replacement record.
3. **Identify reference tasks:** Parse tasks that remain relevant. Historical checkboxes are not live state. Confirm selected scope in the conversation.
4. **Batch tasks:** Group 2-3 related items. Keep dependencies together or execute in dependency order.
5. **Execute batch:** Run the single-task cycle for each task. Run the proactive quality gate on the batch diff. Record completion, verification evidence, and changed scope in the conversation. Never change the plan file.
6. **Review checkpoint:** Present what was done, issues, and next work. Obtain approval for the next batch unless the user already authorized continuing through it. Resolve scope changes before implementing them.
7. **Commit when authorized:** After each successful batch, commit with a descriptive imperative message when task authority permits.
8. **Complete:** Run the full discovered verification suite. Report Passed, Failed, and Incomplete, including exact commands and red/green evidence.
9. **Review:** Present the diff for `/core:review`. Delivery requires separate explicit authority; this workflow does not land changes.

### Rules

- **Follow the approved scope.** Explain and confirm material scope changes before implementing. Never silently deviate or edit the reference plan.
- **Never skip required verification.** Every batch passes the repository's required build, typecheck, tests, and lint gates before moving on.
- **Stop when blocked.** Do not guess ambiguous requirements or substitute stale evidence.
- **Plans are read-only.** Future sessions use the conversation summary and code evidence for current progress.
- **Document unplanned work in conversation.** Summarize scope, key files, and verification without rewriting the reference plan.
- **Leave every authorized commit reviewable.** Run the proactive quality gate first. A failed or blocked gate is not completion.

## Proactive quality gate

Run this gate inline before every commit, in both modes. It folds the categories that `/core:review` repeatedly surface into the TDD cycle, so later review gates find little or nothing. Scope it to the diff you just produced (`git diff` of the current change), not the whole branch.

1. **Adversarial review.** Run `/core:adversarial-review` inline on the diff. Fix blockers (critical/major with a failure scenario); defer minor/nitpick per `/core:adversarial-review` triage before continuing. Do not re-specify its checks here; reuse them.
2. **Correctness and security.** Re-read the diff for logic errors, off-by-ones, unhandled edge cases and boundary conditions, and security issues (injection, auth bypass, exposed secrets).
3. **Type safety and validation.** Confirm no `any` or unsafe casts slipped in, and that every new input is validated at its boundary.
4. **Test-gap sweep.** For each new unit of business logic, confirm an edge-case or boundary test exists. If one is missing, add it red-green now, before the commit.
5. **Regression and contracts.** For every changed function signature or behavior, grep the call sites and confirm they still hold. Check mock-based tests that rely on the old behavior, API response-shape changes, and every consumer of a changed DB table or column.
6. **Docs and plan sync.** Update any docs that reference the changed code. In plan mode, report plan-versus-implementation divergence in the conversation; do not change the legacy plan file.

Fix blockers (critical/major with a failure scenario); defer minor/nitpick per `/core:adversarial-review` triage before committing. The gate is not optional; a commit that has not passed it is not done.

### Coverage map

| `/core:review` finding category | Gate item |
| --- | --- |
| Bugs, security, type safety | Items 2 and 3 |
| Test gaps | Item 4 |
| Documentation drift | Item 6 |
| Regression analysis (callers, mocks, API and schema contracts) | Item 5 |
| Style | Item 1 (`/core:adversarial-review`) |

---

## Rationalizations to reject

- **"Too simple to test."** Simple code breaks too. A small behavior test catches future regressions.
- **"I'll add tests after."** You won't. And if you do, you'll write tests that pass by definition instead of tests that drive the design.
- **"It's just a refactor."** Refactors without tests are rewrites. Run existing tests first. If none exist, write characterization tests before changing anything.
- **"The type system catches this."** Types catch type errors. They don't catch logic errors, off-by-ones, or wrong business rules.
- **"I need to explore first."** Explore in a scratch file or REPL. When you're ready to build, start with a test.
- **"`/core:review` will catch it."** That is a late check. The proactive quality gate exists so the review gate finds nothing. Fix it now, not at the review gate.
