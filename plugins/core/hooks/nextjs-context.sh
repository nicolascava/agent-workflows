#!/bin/bash
set -euo pipefail
HOOK_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)" || exit 0
exec "$HOOK_DIR/run-hook.sh" nextjs-context
