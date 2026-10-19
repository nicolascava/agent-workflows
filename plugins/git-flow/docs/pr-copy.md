# PR copy

Use the target repository's required template. The default public shape is below. If its committed template conflicts with this shape, report the conflict and adapt deliberately rather than silently dropping required fields or calling a failed check passed.

```markdown
## Summary

- State the problem and resulting behavior in one short sentence.

## Test plan

- [x] State what ran and its observed result.
- [ ] State what still needs verification.

Related: https://github.com/example/project/issues/12
```

Use a plain imperative title, at most 72 characters, in sentence case, with no trailing period, issue number or Conventional Commits prefix. Wrap code identifiers, commands and filenames in backticks where they help a reader. Use short sentences, straight quotes and no em dashes. Do not add assistant attribution or private process details.

Keep one to three Summary bullets. Describe what changed and why. Keep the Test plan as a flat checkbox list. A checked item needs actual evidence against the reported source. A deferred or failed item stays unchecked. For infrastructure changes, `## Plan output` and `## Rollback` may follow the test plan, in that order. Keep plan output in a language-tagged fence. Do not run an infrastructure apply or deploy to fill these sections.

Use literal canonical issue URLs. Use non-closing `Related:` references unless the user explicitly asks to close the issue. Do not invent a Development link or change issue state. If the optional `issues` plugin is installed, it may help inspect an issue; its mutations need their own authorization.

New descriptions must be visible and must not contain hidden review contracts. Use Markdown rather than raw HTML, which the parser rejects because it can hide or change the rendering of headings and checkboxes. HTML examples belong in code spans or fences. For an update, preserve an existing `review-scope/v1` HTML comment byte for byte. It is legacy metadata, not current review evidence. Preserve existing test-plan checkbox states and their evidence, Plan output and Rollback unless new evidence or an explicitly requested correction justifies a change. Do not normalize the whole body with a parser and lose content.

Write the final title and body to unique temporary files. Inspect the exact visible Markdown against the actual diff. If the optional `specialists` plugin is installed and provides a copy editor, it may review these files. It is not required. A copy editor's pass never authorizes a GitHub write.

Run the local checker before creation or metadata updates:

```bash
bun "${CLAUDE_PLUGIN_ROOT}/bin/check-pr-copy.ts" --title-file "<title-file>" --body-file "<body-file>"
```

For updates, pass `--original-body-file "<original-body-file>"` so unchanged legacy contracts are allowed. Pass `--allow-closing-issues` only for an explicit user request to close. The checker emits `{ "ok": true, "violations": [] }` on success. A nonzero exit blocks posting. It checks title shape, visible sections, summary bullets, test items, malformed fences or comments, issue references, escaped backticks and attribution. It does not judge whether the writing is true or the tests ran. Review those facts yourself and apply additional repository copy rules. Recheck the final files after every rewrite.

To repair literal escaped backticks in a draft, edit that local file and inspect the diff. Plain text replacement or `jq` is sufficient. No separate network-writing repair or copy-marker helper is required. If an optional guard hook is installed, use its documented contribution path. Never fabricate an authorization token or copy marker.
