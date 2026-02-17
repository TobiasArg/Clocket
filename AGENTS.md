# Agent Execution Rules (Repository Scope)

These rules apply to all Codex agents/threads working in this repository.

<!-- CODEX_GLOBAL_POLICY_START -->
## Global Codex Branch + Cleanup Policy

- Every thread/agent must start work using:
  - `~/.codex/tools/codex-task-start.sh "<task description>" --parent origin/main`
- Branch naming is mandatory:
  - `codex/<english-kebab>`
- Cleanup is allowed only post-merge to explicit parent branch:
  - `~/.codex/tools/codex-task-finish.sh --branch codex/<slug> --parent origin/main --yes`
- Cleanup scope is restricted to the thread workspace under:
  - `~/.codex/worktrees/`
- Self thread hard-delete happens only after successful git cleanup, followed by residual scrub in `~/.codex`.

Trigger phrase: if the user says `self-destruction`, execution is mandatory and must run the full finish chain (`codex-task-finish.sh`) so merge verification, scoped git cleanup, and `thread-clean.sh delete --self --yes --scrub-residuals` all occur in order.

If any validation or cleanup step fails, abort in safe mode (no partial destructive fallback) and report the exact failure.

If user explicitly asks to preserve branch/worktree/thread for handoff/debug, skip cleanup and state reason.
<!-- CODEX_GLOBAL_POLICY_END -->


