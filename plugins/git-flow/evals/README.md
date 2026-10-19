# Behavioral scenarios

These are unscored behavioral scenarios. No model runs or scores are included.
They cover contributor branch names, merge gates and visible PR copy.
The self-authored review scenario lives in `plugins/core/evals/` because it tests `/core:review`.
The old development-link scenario was dropped with the private issue policy.

For a manual run, install this plugin and core, start a fresh Claude Code session,
and paste the text below a prompt's frontmatter. Compare the answer with its graders.
Use a disposable repository when a session needs files. Do not grant mutations for these prompts.

The installed `claude plugin --help` and `claude plugin eval --help` document
Markdown prompts with graders and accept a plugin path:

```sh
claude plugin eval ./plugins/git-flow
```

That command starts model runs and can incur usage costs. It was not run for this migration.
The structural test checks files and skill references, not behavior or grader quality.
