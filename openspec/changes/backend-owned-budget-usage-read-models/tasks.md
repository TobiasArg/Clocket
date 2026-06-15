## 1. Backend Budget Usage Read Models

- [x] 1.1 Add backend contracts for budget usage list, summary totals, per-budget spent/progress/overspent values, and detail grouping.
- [x] 1.2 Add a budget usage service that loads active budgets and backend transactions for a requested month.
- [x] 1.3 Centralize scope normalization and transaction matching in backend budget modules.
- [x] 1.4 Compute expense-only monthly spending, raw/clamped progress, remaining/overspent amounts, and per-budget rows.
- [x] 1.5 Add budget detail usage grouping by category/subcategory with stable labels and amounts.
- [x] 1.6 Add budget usage API handlers/routes with month/id validation and controlled errors.

## 2. Backend Tests

- [x] 2.1 Test usage excludes income and transactions outside the requested month.
- [x] 2.2 Test all-subcategories and selected-subcategories scope matching.
- [x] 2.3 Test no-subcategory token behavior where current UI supports it.
- [x] 2.4 Test overlapping budget validation remains enforced by budget CRUD.
- [x] 2.5 Test detail grouping, progress, overspent, empty-state, invalid month, missing budget, and unsupported method behavior.
- [x] 2.6 Validate backend with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Budget Read-Model Cutover

- [x] 3.1 Add frontend HTTP methods for budget usage list and detail usage.
- [x] 3.2 Update `useBudgetsPageModel` to consume backend usage totals instead of recomputing canonical expenses from frontend transactions.
- [x] 3.3 Update `useBudgetDetailPageModel` to consume backend detail usage grouping and summary values.
- [x] 3.4 Preserve current month navigation, empty/error/loading states, category picker behavior, and edit flow.
- [x] 3.5 Add/update frontend tests for usage mapping, empty usage, overspent/progress display, detail grouping, and backend errors.

## 4. Final Verification

- [x] 4.1 Verify budget list totals match backend transactions for current and shifted months.
- [x] 4.2 Verify budget detail grouping matches expected category/subcategory spending.
- [x] 4.3 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [x] 4.4 Run `openspec validate backend-owned-budget-usage-read-models --strict --no-interactive`.
- [x] 4.5 Confirm auth, sessions, authorization, `userId`, shared ledgers, localStorage import, and broad analytics migration remain out of scope.

## Implementation Notes

- Backend exposes `GET /api/budgets/usage?periodMonth=YYYY-MM` and `GET /api/budgets/:id/usage?periodMonth=YYYY-MM` read-model endpoints.
- Usage service loads active budgets plus backend transactions for the requested month and computes expense-only spending, raw/clamped progress, remaining, and overspent values.
- Budget scope matching is centralized in backend and supports all-subcategories, selected subcategory IDs, and the `__none__` no-subcategory token via `includeNoSubcategory` persistence.
- Detail usage groups matching expenses by stable `Category · Subcategory` labels and returns backend amount/percentage data for frontend presentation.
- Frontend budget list/detail hooks now consume repository usage methods instead of reducing raw transactions for canonical usage values.
- Auth, sessions, authorization, `userId`, shared ledgers, localStorage import, and broad analytics migration remain out of scope.
- Manual browser QA was not run in this environment; automated backend/frontend tests cover month filtering, income exclusion, no-subcategory behavior, progress/overspent, detail grouping, and HTTP mapping.
