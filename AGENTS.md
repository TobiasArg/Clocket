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
- Self thread hard-delete happens only after successful git cleanup.

If user explicitly asks to preserve branch/worktree/thread for handoff/debug, skip cleanup and state reason.
<!-- CODEX_GLOBAL_POLICY_END -->

