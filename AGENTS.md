# Agent Execution Rules (Repository Scope)

These rules apply to all Codex agents/threads working in this repository.

## Mandatory post-push cleanup

When an agent finishes a task and has successfully:
- committed the changes, and
- pushed the branch to remote,

the agent must run the cleanup flow unless the user explicitly asks to keep the branch/worktree.

Cleanup command:

```bash
BRANCH="$(git branch --show-current)"
scripts/cleanup-agent-worktree.sh --branch "$BRANCH" --yes --force
```

Expected cleanup behavior:
- remove the task worktree,
- remove the local task branch,
- remove the remote task branch,
- prune remote refs.

## Safety exceptions

Never run cleanup for protected branches:
- `main`
- `master`
- `develop`
- `dev`

If branch/worktree must be preserved (debug, handoff, or user request), skip cleanup and state the reason.
