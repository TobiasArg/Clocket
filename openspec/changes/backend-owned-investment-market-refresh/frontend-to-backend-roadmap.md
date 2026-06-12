## Frontend-to-Backend Migration Roadmap

This roadmap records the subagent analysis requested while creating `backend-owned-investment-market-refresh`. It is advisory context for sequencing future OpenSpec changes. Authentication and user ownership remain explicitly out of scope for the items below unless a later product decision activates `add-auth-user-ownership`.

## P0: Move next

### 1. `backend-owned-investment-market-refresh`

- Current frontend responsibilities: investment quote freshness checks, provider calls, per-tab cooldowns, stale fallback, snapshot writes, daily/month ref updates, and refresh batching.
- Primary files: `frontend/src/domain/investments/refreshPositions.ts`, `frontend/src/data/http/marketQuoteApiClient.ts`, `frontend/src/data/http/investmentsRepository.ts`, `backend/src/modules/market/**`, `backend/src/modules/investments/**`.
- Reason: provider-sensitive financial refresh should be backend-owned now that positions/snapshots/refs are persisted in backend.

### 2. `backend-owned-installment-ledger-effects`

- Current frontend responsibilities: paid-count auto-sync by date, future-date guards, derived active/finished status, and legacy localStorage side effects for generated credit-card account/category/transactions.
- Primary files: `frontend/src/hooks/usePlansPageModel.ts`, `frontend/src/domain/cuotas/**`, `frontend/src/data/localStorage/cuotasRepository.ts`, `backend/src/modules/installments/**`, `backend/src/modules/transactions/**`.
- Reason: generated installment transactions are financial ledger effects and should be idempotent backend operations.

### 3. `backend-owned-budget-usage-read-models`

- Current frontend responsibilities: budget scope normalization, overlap detection, monthly spending calculation, overspent/progress summaries, and detail grouping by category/subcategory.
- Primary files: `frontend/src/domain/budgets/budgetScopeMatcher.ts`, `frontend/src/hooks/useBudgetsPageModel.ts`, `frontend/src/hooks/useBudgetDetailPageModel.ts`, `backend/src/modules/budgets/**`, `backend/src/modules/transactions/**`.
- Reason: budget consumption is a read model over backend-owned transactions and should not diverge by client.

## P1: Move after P0 stabilizes

### 4. `backend-owned-financial-analytics-read-models`

- Current frontend responsibilities: home/statistics monthly balances, cash flow buckets, category breakdowns, goal trends, account summaries, and local statistics scope preference.
- Primary files: `frontend/src/hooks/useHomePageModel.ts`, `frontend/src/hooks/useStatisticsPageModel.ts`, `frontend/src/domain/statistics/**`, `frontend/src/domain/transactions/monthlyBalance.ts`.
- Reason: analytics can be computed from backend-owned records; backend read models will reduce duplicated definitions of income, expense, saving, and goal progress.

### 5. `backend-owned-goal-progress-and-entry-resolution`

- Current frontend responsibilities: goal progress from transactions, saved amount aggregation, delete/redirect/delete-entry policies, fallback category creation, and transaction retagging on goal edits.
- Primary files: `frontend/src/hooks/useGoalsPageModel.ts`, `frontend/src/hooks/useGoalDetailPageModel.ts`, `backend/src/modules/goals/**`, `backend/src/modules/transactions/**`, `backend/src/modules/categories/**`.
- Reason: resolving goal-linked entries is a multi-entity mutation that should be transactional.

### 6. `backend-owned-transaction-classification-and-category-constraints`

- Current frontend responsibilities: income category inference by name/id, transaction icon/meta shaping, category/subcategory dedupe rules, and some usage constraints.
- Primary files: `frontend/src/hooks/useTransactionsPageModel.ts`, `frontend/src/hooks/useCategoriesPageModel.ts`, `frontend/src/data/http/transactionsRepository.ts`, `frontend/src/data/http/categoriesRepository.ts`.
- Reason: classification and category constraints influence financial data integrity and should be explicit backend rules rather than naming heuristics.

## P2: Cleanup and production hardening

### 7. `frontend-localstorage-repository-retirement`

- Current state: active bindings use HTTP repositories, but legacy localStorage repositories still contain full historical business rules and remain exported for tests/compatibility.
- Reason: retiring or clearly quarantining localStorage repositories reduces accidental reintroduction of client-owned persistence rules.

### 8. `backend-owned-exchange-rate-boundary`

- Current state: currency conversion uses frontend constants/fixed rate behavior.
- Reason: exchange rates affect financial values and should come from a documented backend boundary before multi-device production use.

### 9. `settings-export-contract-hardening`

- Current state: export/CSV generation is browser-composed from HTTP repositories.
- Reason: backend-canonical export/import should eventually validate complete snapshots, versioning, and checksums. Import remains out of scope until explicitly specified.

## Cross-cutting risks

- Avoid double application of rules during cutovers; once a backend operation owns a rule, frontend should map/display rather than recompute canonical state.
- Preserve date/time semantics: date-only, month keys, ISO timestamps, UTC refresh days, and local UI labels must be tested explicitly.
- Keep clean-start rules intact: do not reintroduce localStorage import or legacy IDs.
- Keep auth out of scope: new endpoints are single-ledger until `add-auth-user-ownership` is intentionally implemented.
- Prefer staged specs with backend tests, frontend mapping tests, build validation, OpenSpec strict validation, and focused live/browser QA.
