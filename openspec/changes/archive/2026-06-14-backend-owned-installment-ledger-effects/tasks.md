## 1. Backend Installment Ledger Orchestration

- [x] 1.1 Add backend contracts for mark-paid, reconcile-due, generated transaction metadata, idempotency status, and future-date guard responses.
- [x] 1.2 Add an installment ledger effects service that resolves plans, calculates due installment indexes, and creates deterministic transaction inputs.
- [x] 1.3 Implement idempotent generated transaction reconciliation using installment plan and installment index semantics.
- [x] 1.4 Enforce future-date guards and paid-count bounds with injectable date/time.
- [x] 1.5 Run plan paid-count updates and generated transaction writes/deletes atomically.
- [x] 1.6 Add explicit API handlers/routes for mark-paid and reconcile-due behavior.

## 2. Backend Tests

- [x] 2.1 Test mark-paid increments paid count and creates exactly one generated transaction.
- [x] 2.2 Test repeated mark-paid/reconcile calls do not duplicate generated transactions.
- [x] 2.3 Test future installment attempts return controlled blocked state without ledger writes.
- [x] 2.4 Test reconcile-due catches elapsed installments and updates paid count transactionally.
- [x] 2.5 Test plan update/delete behavior reconciles generated effects safely.
- [x] 2.6 Validate backend with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Plans Cutover

- [x] 3.1 Add frontend HTTP methods for mark-paid and reconcile-due installment actions.
- [x] 3.2 Remove canonical paid-count auto-sync logic from `usePlansPageModel`.
- [x] 3.3 Update manual paid action to call backend mark-paid endpoint and map blocked/future-date responses.
- [x] 3.4 Preserve current active/finished visual behavior from backend-canonical plan data.
- [x] 3.5 Add/update frontend tests for mark-paid success, blocked future installment, idempotent response mapping, and error states.

## 4. Final Verification

- [x] 4.1 Verify creating a cuota and marking due installments paid creates backend ledger effects once.
- [x] 4.2 Verify repeated reload/reconcile does not duplicate generated transactions.
- [x] 4.3 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [x] 4.4 Run `openspec validate backend-owned-installment-ledger-effects --strict --no-interactive`.
- [x] 4.5 Confirm auth, sessions, authorization, `userId`, shared ledgers, and localStorage import remain out of scope.

## Implementation Notes

- Backend exposes `POST /api/installments/:id/mark-paid` and `POST /api/installments/reconcile-due` action endpoints.
- Generated transaction reconciliation uses active transaction lookup by `installmentPlanId` plus `cuotaInstallmentIndex`; repeated mark/reconcile calls reuse existing active rows instead of creating duplicates.
- Backend creates/reuses the default `Tarjeta de Credito` account for generated ledger effects; auth/user ownership remains deferred.
- Future installments return a controlled `blocked_future` response with no paid-count or transaction write.
- Plan delete/clear soft-delete related active generated transaction rows in the same transaction as plan deletion.
- Frontend plans no longer performs local paid-count auto-sync; it calls explicit backend reconcile and mark-paid operations and maps `blocked_future` to the existing invalid-date feedback.
- Manual browser QA was not run in this environment; automated backend/frontend tests cover the due, blocked, idempotent, reconcile, and mapping scenarios.
