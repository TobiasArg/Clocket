## 1. Backend Classification and Constraint Rules

- [ ] 1.1 Add category classification contracts for transaction editor options and category usage/constraints.
- [ ] 1.2 Add backend validation for transaction amount sign, category type eligibility, account reference, category reference, and subcategory reference.
- [ ] 1.3 Add backend transaction shaping for icon, icon background, amount classification, and category/subcategory labels.
- [ ] 1.4 Add backend category/subcategory duplicate prevention using normalized names.
- [ ] 1.5 Add backend category/subcategory in-use deletion constraints.
- [ ] 1.6 Add API handlers or extend existing handlers with controlled validation errors.

## 2. Backend Tests

- [ ] 2.1 Test income transaction classification does not depend on frontend name/id heuristics.
- [ ] 2.2 Test expense and saving transaction category validation.
- [ ] 2.3 Test invalid account/category/subcategory references.
- [ ] 2.4 Test duplicate category and duplicate subcategory prevention.
- [ ] 2.5 Test category/subcategory deletion constraints when transactions reference them.
- [ ] 2.6 Validate backend with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Cutover

- [ ] 3.1 Add frontend HTTP mapping for backend category classification/options and constraint responses.
- [ ] 3.2 Update transaction editor flow to use backend-provided category eligibility instead of name/id income heuristics.
- [ ] 3.3 Update transaction create/update flow so backend derives canonical classification/presentation metadata.
- [ ] 3.4 Update category page flow so duplicate and in-use rules are enforced by backend responses.
- [ ] 3.5 Preserve current forms, validation states, usage messaging, and empty/error behavior.

## 4. Final Verification

- [ ] 4.1 Run `openspec validate backend-owned-transaction-classification-and-category-constraints --strict --no-interactive`.
- [ ] 4.2 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [ ] 4.3 Verify transaction/category flows manually.
- [ ] 4.4 Confirm auth, sessions, authorization, `userId`, shared ledgers, and localStorage import remain out of scope.
