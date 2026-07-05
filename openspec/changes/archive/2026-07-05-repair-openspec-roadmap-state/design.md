## Context

Most backend-ownership specs have been implemented and archived. The remaining active change is `add-auth-user-ownership`, but roadmap docs still include stale P2 state and old localStorage context. This makes future planning ambiguous.

## Goals / Non-Goals

**Goals:**

- Make OpenSpec context reflect the current backend-owned, HTTP-repository architecture.
- Make implementation order accurately list completed, active, and future-gated work.
- Replace placeholder `Purpose: TBD` sections with concise useful purposes.
- Create traceability from capability to representative tests/manual QA.

**Non-Goals:**

- No application runtime changes.
- No implementation of auth/user ownership.
- No deletion of archived history.

## Decisions

1. **Roadmap state is documentation, not implementation.** This change updates governance artifacts only.
2. **Archive remains source history.** Do not move archived changes unless a separate archival cleanup is required.
3. **Traceability should be lightweight.** Prefer a markdown matrix over generated tooling.
4. **Future gates stay explicit.** Auth, sessions, user ownership, shared ledgers, import/restore, and localStorage import remain separate decisions.

## Risks / Trade-offs

- Updating context can conflict with older archived proposal language → only current config/roadmap/canonical specs need to be current.
- Traceability can become stale → include a maintenance note and validate during future archive steps.
