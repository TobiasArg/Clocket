## 1. Backend Budget Usage Read Models

- [ ] 1.1 Add backend contracts for budget usage list, summary totals, per-budget spent/progress/overspent values, and detail grouping.
- [ ] 1.2 Add a budget usage service that loads active budgets and backend transactions for a requested month.
- [ ] 1.3 Centralize scope normalization and transaction matching in backend budget modules.
- [ ] 1.4 Compute expense-only monthly spending, raw/clamped progress, remaining/overspent amounts, and per-budget rows.
- [ ] 1.5 Add budget detail usage grouping by category/subcategory with stable labels and amounts.
- [ ] 1.6 Add budget usage API handlers/routes with month/id validation and controlled errors.

## 2. Backend Tests

- [ ] 2.1 Test usage excludes income and transactions outside the requested month.
- [ ] 2.2 Test all-subcategories and selected-subcategories scope matching.
- [ ] 2.3 Test no-subcategory token behavior where current UI supports it.
- [ ] 2.4 Test overlapping budget validation remains enforced by budget CRUD.
- [ ] 2.5 Test detail grouping, progress, overspent, empty-state, invalid month, missing budget, and unsupported method behavior.
- [ ] 2.6 Validate backend with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Budget Read-Model Cutover

- [ ] 3.1 Add frontend HTTP methods for budget usage list and detail usage.
- [ ] 3.2 Update `useBudgetsPageModel` to consume backend usage totals instead of recomputing canonical expenses from frontend transactions.
- [ ] 3.3 Update `useBudgetDetailPageModel` to consume backend detail usage grouping and summary values.
- [ ] 3.4 Preserve current month navigation, empty/error/loading states, category picker behavior, and edit flow.
- [ ] 3.5 Add/update frontend tests for usage mapping, empty usage, overspent/progress display, detail grouping, and backend errors.

## 4. Final Verification

- [ ] 4.1 Verify budget list totals match backend transactions for current and shifted months.
- [ ] 4.2 Verify budget detail grouping matches expected category/subcategory spending.
- [ ] 4.3 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [ ] 4.4 Run `openspec validate backend-owned-budget-usage-read-models --strict --no-interactive`.
- [ ] 4.5 Confirm auth, sessions, authorization, `userId`, shared ledgers, localStorage import, and broad analytics migration remain out of scope.
