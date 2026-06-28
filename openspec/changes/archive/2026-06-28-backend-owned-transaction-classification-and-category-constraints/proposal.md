## Why

Transaction classification and category constraints still depend on frontend heuristics. The transactions page infers income categories by category name/id, shapes transaction icon/meta from selected category data, and category flows enforce duplicate/usage behavior in browser logic.

These rules affect financial integrity and should be explicit backend rules instead of client naming heuristics. Auth and user ownership remain out of scope.

## What Changes

- Add backend-owned transaction classification rules for income/expense/saving semantics, category/subcategory validation, amount sign consistency, and presentation metadata.
- Add backend category/subcategory constraints for duplicate prevention and in-use deletion behavior.
- Cut over frontend transaction/category page models to consume backend-provided options, validation errors, and shaped transaction records.
- Preserve existing editor/category UI interactions.
- Non-goal: auth, sessions, authorization, `userId`, shared ledgers, broad account reconciliation, or UX redesign.

## Capabilities

### New Capabilities

- `backend-owned-transaction-classification-and-category-constraints`: Backend-owned transaction classification and category integrity rules.

### Modified Capabilities

- None.

## Impact

- Backend: `backend/src/modules/transactions/**`, `backend/src/modules/categories/**`, transaction/category API handlers/tests.
- Frontend: `frontend/src/hooks/useTransactionsPageModel.ts`, `frontend/src/hooks/useCategoriesPageModel.ts`, HTTP mapping/tests.
- Validation: backend/frontend tests and manual transaction/category QA.
