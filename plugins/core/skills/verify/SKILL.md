---
name: verify
description: "Run build, typecheck, tests, and lint; report without fixing."
---
# Verify workflow

Validate completed work and report what passes and what does not. Do not fix issues unless explicitly asked. Verify the current worktree and preserve unrelated changes. Running approved build and test commands may create their normal artifacts; do not install tools, change configuration, or start services without task authority.

Read `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md` before code-dependent work. Use the intended current worktree only. Read `AGENTS.md`, `CLAUDE.md`, contribution guidance, and `git-workflow.json` only if present. Discover the package manager and required test, build, typecheck, and lint commands from package scripts, lockfiles, a Makefile, or CI configuration. Do not require a particular workflow mode.

Confirm the target repository, configured remote, and comparison branch. From that worktree, run `"${CLAUDE_PLUGIN_ROOT}/bin/verification-source.ts" --base <confirmed-base>`; add `--remote <configured-name>` when needed. Require exit 0 and well-formed ready evidence. The live worktree, including uncommitted changes, is the subject. Use the freshly fetched full `baseOid` for comparisons. Block on missing or ambiguous evidence. Never substitute another checkout, a symbolic ref, or a cache. This is not clean default-branch evidence.

Report source-collection failure under Failed and mark dependent checks Incomplete. Do not continue code-dependent checks without ready evidence.

Redirect each check to a unique log outside the worktree. Read bounded error ranges and pass/fail counts. Keep exact commands, exit statuses, and source identity with the report. Do not infer success from empty output.

1. **Build:** Run the discovered build command. Some type errors surface only during build.
2. **Typecheck:** Run the discovered typecheck command. Capture errors.
3. **Test:** Run the discovered test command. Capture pass/fail counts and failure details.
4. **Browser checks:** For UI changes, discover existing accessibility and visual checks from test configuration and CI. Run them when supported and authorized. Missing browsers, services, or other prerequisites go under Incomplete. Do not silently install or start them.
5. **Lint:** Run the discovered lint command. Capture warnings and errors.

6. **Review**: Read the changed files and verify the implementation matches the stated goal or spec. Note any missing behavior or edge cases.

7. **Report**: Present results in three sections:

   - **Passed**: What works (tests, typecheck, lint, manual checks).
   - **Failed**: What failed with exact error messages.
   - **Incomplete**: Missing behavior, edge cases, or follow-ups not yet addressed.

Keep the report concise and actionable.
