## 1. Backend Classification and Constraint Rules

- [x] 1.1 Add category classification contracts for transaction editor options and category usage/constraints.
- [x] 1.2 Add backend validation for transaction amount sign, category type eligibility, account reference, category reference, and subcategory reference.
- [x] 1.3 Add backend transaction shaping for icon, icon background, amount classification, and category/subcategory labels.
- [x] 1.4 Add backend category/subcategory duplicate prevention using normalized names.
- [x] 1.5 Add backend category/subcategory in-use deletion constraints.
- [x] 1.6 Add API handlers or extend existing handlers with controlled validation errors.

## 2. Backend Tests

- [x] 2.1 Test income transaction classification does not depend on frontend name/id heuristics.
- [x] 2.2 Test expense and saving transaction category validation.
- [x] 2.3 Test invalid account/category/subcategory references.
- [x] 2.4 Test duplicate category and duplicate subcategory prevention.
- [x] 2.5 Test category/subcategory deletion constraints when transactions reference them.
- [x] 2.6 Validate backend with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Cutover

- [x] 3.1 Add frontend HTTP mapping for backend category classification/options and constraint responses.
- [x] 3.2 Update transaction editor flow to use backend-provided category eligibility instead of name/id income heuristics.
- [x] 3.3 Update transaction create/update flow so backend derives canonical classification/presentation metadata.
- [x] 3.4 Update category page flow so duplicate and in-use rules are enforced by backend responses.
- [x] 3.5 Preserve current forms, validation states, usage messaging, and empty/error behavior.

## 4. Final Verification

- [x] 4.1 Run `openspec validate backend-owned-transaction-classification-and-category-constraints --strict --no-interactive`.
- [x] 4.2 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [x] 4.3 Verify transaction/category flows manually.
- [x] 4.4 Confirm auth, sessions, authorization, `userId`, shared ledgers, and localStorage import remain out of scope.
