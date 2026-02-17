#!/usr/bin/env bash
set -euo pipefail

GLOBAL_SCRIPT="${CODEX_GLOBAL_CLEANUP_SCRIPT:-$HOME/.codex/tools/cleanup-agent-worktree.sh}"

if [[ ! -x "$GLOBAL_SCRIPT" ]]; then
  echo "Error: global cleanup script not found or not executable: $GLOBAL_SCRIPT" >&2
  exit 3
fi

exec "$GLOBAL_SCRIPT" "$@"
