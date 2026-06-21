## Why

Clocket persists financial records in the backend, but home/statistics analytics are still assembled in frontend hooks from raw accounts, transactions, categories, goals, installments, and settings. This duplicates definitions for income, expense, savings, monthly balance, category breakdowns, goal progress, and trend buckets in browser code.

Analytics are read models over backend-owned records and should become backend-owned after the core/feature persistence cutovers stabilize. Auth and user ownership remain explicitly out of scope.

## What Changes

- Add backend-owned analytics read models and API endpoints for home and statistics summaries.
- Centralize monthly balances, cash-flow buckets, category breakdowns, account summaries, goal savings/progress, and date-bucket semantics in backend services.
- Cut over frontend home/statistics page models to consume backend analytics responses and map them to existing UI shapes.
- Preserve UI presentation, chart/card components, frontend scope preference where it is UI-only, and clean-start behavior.
- Non-goal: auth, sessions, authorization, `userId`, shared ledgers, export/import, or full reporting/audit platform behavior.

## Capabilities

### New Capabilities

- `backend-owned-financial-analytics-read-models`: Backend-owned financial analytics summaries for home/statistics views.

### Modified Capabilities

- None.

## Impact

- Backend: new analytics module/routes, reads from accounts/categories/transactions/goals/installments, backend tests.
- Frontend: `frontend/src/hooks/useHomePageModel.ts`, `frontend/src/hooks/useStatisticsPageModel.ts`, analytics HTTP mapping tests.
- Validation: backend tests/build, frontend tests/build, OpenSpec strict validation, and manual comparison against fixed datasets.
