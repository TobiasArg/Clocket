#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/cleanup-agent-worktree.sh [options]

Options:
  --branch <name>     Branch to clean up (default: current branch)
  --worktree <path>   Worktree path to remove (default: auto-detect by branch)
  --remote <name>     Remote name for remote branch deletion (default: origin)
  --force             Force remove worktree and local branch
  --yes               Non-interactive; skip confirmation prompt
  --dry-run           Print actions without executing
  --help              Show this help

Examples:
  scripts/cleanup-agent-worktree.sh --branch rescue/ec91 --yes
  scripts/cleanup-agent-worktree.sh --branch codex/feature-x --force --yes
  scripts/cleanup-agent-worktree.sh --branch rescue/ec91 --dry-run
EOF
}

BRANCH=""
WORKTREE="auto"
REMOTE="origin"
FORCE=0
YES=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --worktree)
      WORKTREE="${2:-}"
      shift 2
      ;;
    --remote)
      REMOTE="${2:-}"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --yes)
      YES=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: run this script from a git repository/worktree." >&2
  exit 1
fi

GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
GIT_CMD=(git --git-dir="${GIT_COMMON_DIR}")

if [[ -z "$BRANCH" ]]; then
  BRANCH="$("${GIT_CMD[@]}" branch --show-current)"
fi

if [[ -z "$BRANCH" ]]; then
  echo "Error: could not determine a branch. Use --branch." >&2
  exit 1
fi

case "$BRANCH" in
  main|master|develop|dev)
    echo "Refusing to delete protected branch '$BRANCH'." >&2
    exit 1
    ;;
esac

find_worktree_for_branch() {
  local branch_ref="refs/heads/$1"
  "${GIT_CMD[@]}" worktree list --porcelain | awk -v target="$branch_ref" '
    $1 == "worktree" { wt = $2 }
    $1 == "branch" && $2 == target { print wt; exit }
  '
}

if [[ "$WORKTREE" == "auto" ]]; then
  WORKTREE="$(find_worktree_for_branch "$BRANCH")"
fi

run_cmd() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] $*"
    return 0
  fi
  "$@"
}

if [[ "$YES" -ne 1 ]]; then
  echo "Cleanup plan:"
  echo "- local branch: $BRANCH"
  echo "- worktree: ${WORKTREE:-<not found>}"
  echo "- remote branch: $REMOTE/$BRANCH (if exists)"
  if [[ "$FORCE" -eq 1 ]]; then
    echo "- mode: force"
  fi
  read -r -p "Continue? [y/N] " answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) echo "Aborted."; exit 0 ;;
  esac
fi

if [[ -n "$WORKTREE" && -d "$WORKTREE" ]]; then
  if [[ "$(pwd -P)" == "$WORKTREE"* ]]; then
    cd "${HOME}"
  fi
  if [[ "$FORCE" -eq 1 ]]; then
    run_cmd "${GIT_CMD[@]}" worktree remove --force "$WORKTREE"
  else
    run_cmd "${GIT_CMD[@]}" worktree remove "$WORKTREE"
  fi
else
  echo "Worktree not found for branch '$BRANCH'; skipping worktree removal."
fi

if "${GIT_CMD[@]}" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  if [[ "$FORCE" -eq 1 ]]; then
    run_cmd "${GIT_CMD[@]}" branch -D "$BRANCH"
  else
    run_cmd "${GIT_CMD[@]}" branch -d "$BRANCH"
  fi
else
  echo "Local branch '$BRANCH' not found; skipping local branch deletion."
fi

if "${GIT_CMD[@]}" ls-remote --exit-code --heads "$REMOTE" "$BRANCH" >/dev/null 2>&1; then
  run_cmd "${GIT_CMD[@]}" push "$REMOTE" --delete "$BRANCH"
else
  echo "Remote branch '$REMOTE/$BRANCH' not found; skipping remote deletion."
fi

run_cmd "${GIT_CMD[@]}" fetch --prune "$REMOTE"

echo "Cleanup completed for branch '$BRANCH'."
