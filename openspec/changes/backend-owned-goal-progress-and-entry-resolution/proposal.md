## Why

Goal progress and goal-entry resolution remain browser-owned. The frontend calculates saved amount from transactions, updates linked transaction metadata after goal edits, creates fallback categories, redirects entries, deletes entries, and then deletes goals through multiple client-driven operations.

These are multi-entity financial mutations and read models over backend-owned data. They should be backend-owned and transactional while auth/user ownership remains out of scope.

## What Changes

- Add backend-owned goal progress read behavior and goal-entry resolution operations.
- Centralize saved amount aggregation, progress percentage, goal edit propagation, delete-entry/redirect policies, fallback category handling, and transaction retagging in backend services.
- Cut over frontend goal list/detail flows so they call backend goal operations and display returned state.
- Preserve existing UI dialogs and choices: redirect to goal, redirect to account, or delete entries.
- Non-goal: auth, sessions, authorization, `userId`, shared ledgers, localStorage import, or goal UI redesign.

## Capabilities

### New Capabilities

- `backend-owned-goal-progress-and-entry-resolution`: Backend-owned goal progress calculations and linked-entry resolution operations.

### Modified Capabilities

- None.

## Impact

- Backend: `backend/src/modules/goals/**`, `backend/src/modules/transactions/**`, `backend/src/modules/categories/**`, goal API routes, backend tests.
- Frontend: `frontend/src/hooks/useGoalsPageModel.ts`, `frontend/src/hooks/useGoalDetailPageModel.ts`, goal HTTP mapping tests.
- Validation: backend/frontend tests and manual QA for goal edit/delete resolution modes.
