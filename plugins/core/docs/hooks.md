# Core hooks

Registrations live in [hooks.json](../hooks/hooks.json). They follow the [Claude Code plugin hooks reference](https://code.claude.com/docs/en/plugins-reference#hooks) and the [hook handler schema](https://code.claude.com/docs/en/hooks#configuration). The dispatcher and guard shim hold no repository policy.

## Session start

The hook adds documentation guidance. It also points to [Next.js guidance](nextjs.md) when the target package, or a declared workspace package, lists `next` in its dependencies or development dependencies.

## Format after edit

Formatting after `Write`, `Edit`, or `NotebookEdit` is off by default. Start Claude Code with `CORE_FORMAT_AFTER_EDIT=1 claude` to turn it on.

The hook runs the target package's `format` script, then its `lint:fix` script, with the package manager its lockfile names. Conflicting lockfiles skip formatting. Without a matching script and lockfile, it looks for a Prettier, Biome, or ESLint config and its installed executable in `node_modules/.bin`.

It never installs tools. It skips missing formatters, files outside the target package, generated directories such as `node_modules`, `.next`, `dist`, and `build`, and `NotebookEdit` events without a file path. Formatter commands have a ten-second deadline, and their output is discarded.

## Input limits

Hooks use the input `cwd`, then `CLAUDE_PROJECT_DIR` when `cwd` is absent. They check `CLAUDE_PLUGIN_ROOT` against the physical install path. Input has a two-second deadline and a 1 MiB size limit. Invalid input adds no guidance, and the guard shim denies invalid calls.
