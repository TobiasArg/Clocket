#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage:
  cleanup-agent-worktree.sh --branch <codex/...> --parent <remote/base> [options]

Required:
  --branch <name>      Branch to clean (must match codex/<english-kebab>)
  --parent <remote/base>
                       Parent remote branch used for post-merge validation (e.g. origin/main)

Options:
  --remote <name>      Remote name (default: inferred from --parent, fallback origin)
  --force              Force remove worktree and local branch
  --yes                Non-interactive; skip confirmation prompt
  --dry-run            Print actions without executing mutating commands
  --help               Show this help

Behavior:
- Post-merge cleanup only.
- Scope restricted to worktrees under ~/.codex/worktrees.
- Deletes only: target worktree, target local branch, target remote branch.
- If Git cleanup succeeds, triggers self thread deletion plus residual scrub.
USAGE
}

BRANCH=""
PARENT=""
REMOTE=""
FORCE=0
YES=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --parent)
      PARENT="${2:-}"
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

if [[ -z "$BRANCH" || -z "$PARENT" ]]; then
  echo "Error: --branch and --parent are required." >&2
  usage
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: run this script from a git repository/worktree." >&2
  exit 1
fi

if [[ ! "$BRANCH" =~ ^codex/[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: branch '$BRANCH' must match codex/<english-kebab>." >&2
  exit 1
fi

case "$BRANCH" in
  main|master|develop|dev)
    echo "Refusing to delete protected branch '$BRANCH'." >&2
    exit 1
    ;;
esac

if [[ "$PARENT" != */* ]]; then
  echo "Error: --parent must be in format <remote>/<base> (e.g. origin/main)." >&2
  exit 1
fi

PARENT_REMOTE="${PARENT%%/*}"
PARENT_BASE="${PARENT#*/}"
if [[ -z "$PARENT_REMOTE" || -z "$PARENT_BASE" || "$PARENT_REMOTE" == "$PARENT_BASE" ]]; then
  echo "Error: invalid --parent value '$PARENT'." >&2
  exit 1
fi

if [[ -z "$REMOTE" ]]; then
  REMOTE="$PARENT_REMOTE"
elif [[ "$REMOTE" != "$PARENT_REMOTE" ]]; then
  echo "Error: --remote '$REMOTE' must match parent remote '$PARENT_REMOTE'." >&2
  exit 1
fi

GIT_COMMON_DIR="$(git rev-parse --git-common-dir)"
GIT_CMD=(git --git-dir="$GIT_COMMON_DIR")
PARENT_REF="$REMOTE/$PARENT_BASE"
SAFE_WORKTREE_PREFIX="$HOME/.codex/worktrees/"
THREAD_CLEAN_SCRIPT="$HOME/.codex/tools/thread-clean.sh"

run_mutation() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] $*"
    return 0
  fi
  "$@"
}

find_matching_worktrees() {
  local branch_ref="refs/heads/$1"
  "${GIT_CMD[@]}" worktree list --porcelain | awk -v target="$branch_ref" '
    $1 == "worktree" { wt = $2 }
    $1 == "branch" && $2 == target { print wt }
  '
}

MATCHED_WORKTREES=()
while IFS= read -r wt; do
  [[ -n "$wt" ]] && MATCHED_WORKTREES+=("$wt")
done < <(find_matching_worktrees "$BRANCH")

if [[ "${#MATCHED_WORKTREES[@]}" -ne 1 ]]; then
  echo "Error: expected exactly one worktree for '$BRANCH', got ${#MATCHED_WORKTREES[@]}." >&2
  exit 1
fi

WORKTREE_PATH="${MATCHED_WORKTREES[0]}"
WORKTREE_REAL="$(python3 - <<'PY' "$WORKTREE_PATH"
import os,sys
print(os.path.realpath(sys.argv[1]))
PY
)"

case "$WORKTREE_REAL" in
  "$SAFE_WORKTREE_PREFIX"*) ;;
  *)
    echo "Error: refusing cleanup outside $SAFE_WORKTREE_PREFIX" >&2
    echo "Resolved worktree: $WORKTREE_REAL" >&2
    exit 1
    ;;
esac

if ! "${GIT_CMD[@]}" remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "Error: remote '$REMOTE' not found." >&2
  exit 1
fi

if ! "${GIT_CMD[@]}" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "Error: local branch '$BRANCH' not found." >&2
  exit 1
fi

if [[ "$YES" -ne 1 ]]; then
  echo "Cleanup plan:"
  echo "- branch: $BRANCH"
  echo "- parent: $PARENT_REF"
  echo "- worktree: $WORKTREE_REAL"
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

if ! "${GIT_CMD[@]}" fetch "$REMOTE" "$PARENT_BASE" >/dev/null 2>&1; then
  echo "Error: failed to fetch parent base '$REMOTE/$PARENT_BASE'." >&2
  exit 1
fi

REMOTE_BRANCH_EXISTS=0
if "${GIT_CMD[@]}" ls-remote --exit-code --heads "$REMOTE" "$BRANCH" >/dev/null 2>&1; then
  REMOTE_BRANCH_EXISTS=1
  if ! "${GIT_CMD[@]}" fetch "$REMOTE" "$BRANCH" >/dev/null 2>&1; then
    echo "Error: failed to fetch remote branch '$REMOTE/$BRANCH'." >&2
    exit 1
  fi
fi

if [[ "$REMOTE_BRANCH_EXISTS" -eq 1 ]]; then
  if ! "${GIT_CMD[@]}" merge-base --is-ancestor "$REMOTE/$BRANCH" "$PARENT_REF"; then
    echo "Error: '$REMOTE/$BRANCH' is not merged into '$PARENT_REF'. Cleanup aborted." >&2
    exit 1
  fi
else
  LOCAL_TIP="$("${GIT_CMD[@]}" rev-parse "$BRANCH")"
  if ! "${GIT_CMD[@]}" merge-base --is-ancestor "$LOCAL_TIP" "$PARENT_REF"; then
    echo "Error: local tip '$BRANCH' is not merged into '$PARENT_REF'. Cleanup aborted." >&2
    exit 1
  fi
fi

if [[ "$(pwd -P)" == "$WORKTREE_REAL"* ]]; then
  cd "$HOME"
fi

if [[ "$FORCE" -eq 1 ]]; then
  run_mutation "${GIT_CMD[@]}" worktree remove --force "$WORKTREE_REAL"
else
  run_mutation "${GIT_CMD[@]}" worktree remove "$WORKTREE_REAL"
fi

if "${GIT_CMD[@]}" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  if [[ "$FORCE" -eq 1 ]]; then
    run_mutation "${GIT_CMD[@]}" branch -D "$BRANCH"
  else
    run_mutation "${GIT_CMD[@]}" branch -d "$BRANCH"
  fi
fi

if "${GIT_CMD[@]}" ls-remote --exit-code --heads "$REMOTE" "$BRANCH" >/dev/null 2>&1; then
  run_mutation "${GIT_CMD[@]}" push "$REMOTE" --delete "$BRANCH"
fi

run_mutation "${GIT_CMD[@]}" fetch --prune "$REMOTE"

echo "Git cleanup completed for '$BRANCH'."

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "[dry-run] $THREAD_CLEAN_SCRIPT delete --self --yes --scrub-residuals"
  exit 0
fi

if [[ ! -x "$THREAD_CLEAN_SCRIPT" ]]; then
  echo "Warning: thread-clean script not found at $THREAD_CLEAN_SCRIPT. Skipping self-delete." >&2
  exit 0
fi

"$THREAD_CLEAN_SCRIPT" delete --self --yes --scrub-residuals

echo "Self thread delete completed."
