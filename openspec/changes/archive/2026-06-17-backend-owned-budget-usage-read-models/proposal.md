## Why

Budgets and transactions are backend-owned, but budget usage is still computed in frontend hooks. The browser normalizes scope rules, matches transactions, calculates spent/progress/overspent amounts, and builds detail breakdowns. Budget usage is a read model over backend transactions and should be canonical in backend services.

## What Changes

- Add backend-owned budget usage read models for monthly summaries and detail breakdowns.
- Centralize budget scope matching, transaction month filtering, expense-only aggregation, progress, remaining, and overspent calculations.
- Cut over budget list/detail frontend flows to consume backend usage read models instead of recomputing canonical spending from raw transactions.
- Preserve existing budget CRUD, UI layout, month navigation, category picker behavior, loading/empty/error states, and auth-out-of-scope boundary.
- Non-goal: auth, sessions, `userId`, shared ledgers, broad analytics migration, or transaction classification redesign.

## Capabilities

### New Capabilities

- `backend-owned-budget-usage-read-models`: Backend-owned budget usage summaries and detail read models derived from backend budgets and transactions.

### Modified Capabilities

- None.

## Impact

- Backend: `backend/src/modules/budgets/**`, `backend/src/modules/transactions/**`, budget API routes, backend tests.
- Frontend: `frontend/src/hooks/useBudgetsPageModel.ts`, `frontend/src/hooks/useBudgetDetailPageModel.ts`, budget HTTP repository/mapping tests.
- Validation: backend tests/build, frontend tests/build, OpenSpec validation, and manual QA comparing budget totals to backend transactions.
