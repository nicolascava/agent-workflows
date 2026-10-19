# Technical-writing rules

Default to short, plain writing. Lead with the point, cut repetition and jargon, and preserve required context, evidence, and technical detail. Revise once for length and plain terms. Honor requested detail and required templates.

## Formatting

- Keep each semantic Markdown prose paragraph on one physical source line. Separate paragraphs with blank lines. Preserve line breaks that carry syntax in code, tables, frontmatter, diagrams, and lists.
- Use sentence case for titles and headings. Use straight quotes. Use periods, commas, or semicolons instead of em dashes.
- Put commands, identifiers, environment variables, file names, paths, package names, and literal values in backticks where code spans render. Leave ordinary words plain.
- Keep Markdown links on one line. Use descriptive labels. Put sentence punctuation after the link.
- Show a draft for the user to send as a blockquote. Keep explanations outside it. A file intended for pasting contains the plain draft without quote prefixes.
- Preserve exact command syntax, error text, identifiers, source links, and observable results. Do not edit a quotation to make evidence look cleaner.

## Change descriptions and findings

Keep required sections, test plans, and references. Describe what changed and why in terms a reader can check. Include implementation details only when needed to find or assess the change. Use concrete triggers and before/after behavior when useful.

Use one short sentence per summary bullet. Test-plan items name a command or an observable result. Distinguish checks that passed, checks that failed, and checks that could not run. Never mark an unrun check complete.

Review comments state the practical effect and requested change. Support technical claims with current evidence. Avoid repeating a gate or commitment in several places. Check that a proposed gate can actually be met by the repository's deployment and approval workflow.

Preserve reference targets and the intended behavior. Do not add issue-closing language, commitments, attribution, or publication side effects without authorization.

These rules cover technical writing only. The [engineering doctrine](DOCTRINE.md) and [simplicity doctrine](simplicity-doctrine.md) preserve the safety and evidence requirements behind the prose.
