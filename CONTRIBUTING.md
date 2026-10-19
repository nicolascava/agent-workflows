# Contributing

Keep each change focused on one plugin.
Shared scaffold and tooling changes may be separate changes.
Write behavior tests before implementing scanner changes.

Do not commit personal data, absolute home paths, customer or company
identifiers, or secrets. Use synthetic fixtures for tests.
Keep private denylist files outside tracked content.

Use Bun 1.3.9 and an installed Claude Code CLI.
CI validates with Claude Code 2.1.290.
No dependency installation is needed for the Bun checks.

Stage new files before scanning because the scanner reads git-tracked files.
Run these checks from the repository root:

```sh
git add <files>
bun test
bun scripts/leak-scan.ts
bun run validate
git diff --cached --check
```

Validation checks the marketplace and every plugin.
CI also runs Gitleaks on the repository history.

To apply private rules, pass a local file:

```sh
bun scripts/leak-scan.ts --denylist <private-file>
```

Use one JavaScript regular expression per line, without slash delimiters.
Blank lines and lines starting with `#` after whitespace are ignored.
Rules are case-sensitive and evaluated per line.
Their indexes start at 1 and count only rule lines.
Reports contain file paths, line numbers, and rule names or indexes.
They do not print source lines or private expressions.
The scanner exits 1 for matches or errors and 0 when clean.

The scanner skips binary files and explicitly marked test fixture files.
It scans the working copies of tracked regular files.
It skips deleted files, symlinks, and submodule directories.
Review skips and staged changes before committing.
