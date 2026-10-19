#!/bin/bash
set -euo pipefail
HOOK_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)" || exit 1
if [ ! -f "$HOOK_DIR/guard-shim.sh" ]; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Missing guard runtime."}}'
  exit 0
fi
source "$HOOK_DIR/guard-shim.sh"
run_guard "hooks/guard-pr-mutation.ts"
