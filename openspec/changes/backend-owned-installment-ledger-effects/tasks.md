## 1. Backend Installment Ledger Orchestration

- [ ] 1.1 Add backend contracts for mark-paid, reconcile-due, generated transaction metadata, idempotency status, and future-date guard responses.
- [ ] 1.2 Add an installment ledger effects service that resolves plans, calculates due installment indexes, and creates deterministic transaction inputs.
- [ ] 1.3 Implement idempotent generated transaction reconciliation using installment plan and installment index semantics.
- [ ] 1.4 Enforce future-date guards and paid-count bounds with injectable date/time.
- [ ] 1.5 Run plan paid-count updates and generated transaction writes/deletes atomically.
- [ ] 1.6 Add explicit API handlers/routes for mark-paid and reconcile-due behavior.

## 2. Backend Tests

- [ ] 2.1 Test mark-paid increments paid count and creates exactly one generated transaction.
- [ ] 2.2 Test repeated mark-paid/reconcile calls do not duplicate generated transactions.
- [ ] 2.3 Test future installment attempts return controlled blocked state without ledger writes.
- [ ] 2.4 Test reconcile-due catches elapsed installments and updates paid count transactionally.
- [ ] 2.5 Test plan update/delete behavior reconciles generated effects safely.
- [ ] 2.6 Validate backend with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Plans Cutover

- [ ] 3.1 Add frontend HTTP methods for mark-paid and reconcile-due installment actions.
- [ ] 3.2 Remove canonical paid-count auto-sync logic from `usePlansPageModel`.
- [ ] 3.3 Update manual paid action to call backend mark-paid endpoint and map blocked/future-date responses.
- [ ] 3.4 Preserve current active/finished visual behavior from backend-canonical plan data.
- [ ] 3.5 Add/update frontend tests for mark-paid success, blocked future installment, idempotent response mapping, and error states.

## 4. Final Verification

- [ ] 4.1 Verify creating a cuota and marking due installments paid creates backend ledger effects once.
- [ ] 4.2 Verify repeated reload/reconcile does not duplicate generated transactions.
- [ ] 4.3 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [ ] 4.4 Run `openspec validate backend-owned-installment-ledger-effects --strict --no-interactive`.
- [ ] 4.5 Confirm auth, sessions, authorization, `userId`, shared ledgers, and localStorage import remain out of scope.
