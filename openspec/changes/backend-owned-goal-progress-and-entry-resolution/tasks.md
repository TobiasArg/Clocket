## 1. Backend Goal Progress and Entry Resolution

- [ ] 1.1 Add backend contracts for goal progress summaries, goal entry presentation data, and entry resolution commands.
- [ ] 1.2 Add service behavior to compute saved amount and progress from goal-linked transactions.
- [ ] 1.3 Add backend operation to propagate goal edits to linked transactions.
- [ ] 1.4 Add backend operation to resolve goal deletion with `delete_entries`, `redirect_goal`, and `redirect_account` modes.
- [ ] 1.5 Ensure fallback category creation/reuse is backend-owned for account redirects.
- [ ] 1.6 Add route handlers and validation for target goal/account/category references.

## 2. Backend Tests

- [ ] 2.1 Test saved amount and progress aggregation from goal-linked entries.
- [ ] 2.2 Test editing a goal updates linked transaction metadata.
- [ ] 2.3 Test delete resolution deletes entries atomically.
- [ ] 2.4 Test redirect-to-goal retags entries to the target goal.
- [ ] 2.5 Test redirect-to-account clears goal linkage and uses fallback category.
- [ ] 2.6 Test invalid target goal/account and unsupported method responses.

## 3. Frontend Cutover

- [ ] 3.1 Add frontend HTTP methods for goal progress and entry resolution operations.
- [ ] 3.2 Update goals page model to display backend-provided saved/progress summaries.
- [ ] 3.3 Update goal detail edit/delete flows to call backend-owned resolution operations instead of looping through transactions client-side.
- [ ] 3.4 Preserve existing dialog choices, validation states, and navigation behavior.
- [ ] 3.5 Add/update frontend tests for progress mapping and resolution flows.

## 4. Final Verification

- [ ] 4.1 Run `openspec validate backend-owned-goal-progress-and-entry-resolution --strict --no-interactive`.
- [ ] 4.2 Run `npm --prefix backend test` and `npm --prefix backend run build`.
- [ ] 4.3 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [ ] 4.4 Confirm auth, sessions, authorization, `userId`, shared ledgers, and localStorage import remain out of scope.
