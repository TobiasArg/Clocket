#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./sync-branches.sh [--push-missing-remote]

What it does:
  1) Fetches and prunes remotes.
  2) Creates missing local branches from origin/* with proper tracking.
  3) Ensures local branch <name> tracks origin/<name> when remote exists.
  4) Optionally pushes local-only branches to origin and sets upstream.

Options:
  --push-missing-remote   Also create missing remote branches from local ones.
  -h, --help              Show this help.
EOF
}

push_missing_remote=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --push-missing-remote)
      push_missing_remote=true
      shift
      ;;
    -h|--help)
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
  echo "Error: run this script inside a git repository." >&2
  exit 1
fi

echo "==> Fetching and pruning remotes..."
git fetch --all --prune

tmp_remote="$(mktemp)"
tmp_local="$(mktemp)"
trap 'rm -f "${tmp_remote}" "${tmp_local}"' EXIT

git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/origin | grep -v '^HEAD$' | sort > "${tmp_remote}"
git for-each-ref --format='%(refname:lstrip=2)' refs/heads | sort > "${tmp_local}"

echo "==> Creating missing local branches from origin..."
while IFS= read -r branch; do
  [[ -z "${branch}" ]] && continue
  if ! git show-ref --verify --quiet "refs/heads/${branch}"; then
    git branch --track "${branch}" "origin/${branch}" >/dev/null
    echo "  + local ${branch} -> origin/${branch}"
  fi
done < "${tmp_remote}"

echo "==> Ensuring local tracking local/<name> -> origin/<name>..."
while IFS= read -r branch; do
  [[ -z "${branch}" ]] && continue
  if git show-ref --verify --quiet "refs/heads/${branch}"; then
    upstream="$(git for-each-ref --format='%(upstream:short)' "refs/heads/${branch}")"
    expected="origin/${branch}"
    if [[ "${upstream}" != "${expected}" ]]; then
      git branch --set-upstream-to="${expected}" "${branch}" >/dev/null 2>&1 || true
      upstream_after="$(git for-each-ref --format='%(upstream:short)' "refs/heads/${branch}")"
      if [[ "${upstream_after}" == "${expected}" ]]; then
        echo "  ~ tracking fixed: ${branch} -> ${expected}"
      fi
    fi
  fi
done < "${tmp_remote}"

if [[ "${push_missing_remote}" == "true" ]]; then
  echo "==> Publishing local-only branches to origin..."
  git for-each-ref --format='%(refname:lstrip=2)' refs/heads | sort > "${tmp_local}"
  git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/origin | grep -v '^HEAD$' | sort > "${tmp_remote}"

  while IFS= read -r branch; do
    [[ -z "${branch}" ]] && continue
    git push -u origin "${branch}"
    echo "  + remote origin/${branch} created"
  done < <(comm -23 "${tmp_local}" "${tmp_remote}")
fi

echo "==> Final branch map"
git branch -vv
