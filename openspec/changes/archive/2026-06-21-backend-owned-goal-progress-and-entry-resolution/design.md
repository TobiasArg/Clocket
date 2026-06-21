## Context

Goals are backend-persisted, but goal progress and linked-entry resolution remain in frontend hooks. Deleting or editing a goal can mutate transactions and categories through multiple browser-driven steps.

## Goals / Non-Goals

**Goals:**

- Backend computes saved amount/progress and linked-entry summaries.
- Backend owns goal edit propagation and delete resolution modes.
- Frontend preserves current dialogs while delegating mutations.
- Auth/user ownership remains out of scope.

**Non-Goals:**

- No auth, sessions, authorization, `userId`, or shared ledgers.
- No redesign of goal UX.
- No localStorage import or legacy ID preservation.

## Decisions

1. **Goal progress is a backend read model.** Saved amount and progress are derived from backend transactions.
2. **Entry resolution uses explicit backend commands.** Delete modes are explicit: `delete_entries`, `redirect_goal`, and `redirect_account`.
3. **Mutations are transactional.** Retagging transactions, creating/reusing fallback category, deleting entries, and deleting the goal should commit or fail together where practical.
4. **Fallback category handling is backend-owned.** Frontend no longer creates fallback categories during goal deletion.
5. **Single-ledger only.** Future user scoping is deferred.

## Risks / Trade-offs

- Current frontend UI depends on specific entry shapes; response mapping tests are required.
- Goal edit propagation can affect many transactions; tests must cover partial failure behavior.
- Fallback category semantics should be deterministic.

## Migration Plan

1. Add goal progress/resolution contracts, services, routes, and backend tests.
2. Add frontend HTTP methods and update goal list/detail page models.
3. Validate all resolution modes manually and with tests.
