#!/bin/bash
set -euo pipefail
HOOK_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)" || exit 0
command -v bun >/dev/null 2>&1 || exit 0
[ -f "$HOOK_DIR/run-hook.ts" ] || exit 0
exec bun --no-install "$HOOK_DIR/run-hook.ts" worktree-budget
