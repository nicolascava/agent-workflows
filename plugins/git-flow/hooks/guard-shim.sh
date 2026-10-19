# Source this file from a guard and call run_guard with a plugin-relative policy.
# This shim has no repository policies of its own.
GIT_FLOW_GUARD_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)" || GIT_FLOW_GUARD_DIR=""

deny() {
  local reason="${1:-${DENY_REASON:-Could not verify this call safely.}}"
  reason=$(printf '%s' "$reason" | LC_ALL=C tr -d '\000-\037')
  reason="${reason//\\/\\\\}"
  reason="${reason//\"/\\\"}"
  DECIDED=1
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$reason"
  exit 0
}

run_guard() {
  [ -n "$GIT_FLOW_GUARD_DIR" ] && [ -f "$GIT_FLOW_GUARD_DIR/run-hook.ts" ] || deny
  command -v bun >/dev/null 2>&1 || deny
  bun --no-install "$GIT_FLOW_GUARD_DIR/run-hook.ts" --guard "$@" || deny
  exit 0
}
