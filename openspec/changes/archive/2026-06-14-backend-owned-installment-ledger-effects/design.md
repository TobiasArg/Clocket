## Context

The feature-domain cutover moved installment plans to backend persistence, but the current frontend still owns important plan lifecycle decisions such as elapsed paid-count auto-sync and future-date guards. Legacy localStorage repository code also documents the original cross-domain side effects: ensuring credit-card account/category state and generating/removing transaction rows for paid cuotas.

## Goals / Non-Goals

**Goals:**

- Make backend services the canonical boundary for paid-count changes and generated installment transactions.
- Keep generated transaction writes idempotent across retries, reloads, and reconcile runs.
- Preserve current UI behavior and copy while moving canonical effects behind backend actions.
- Keep auth, ownership, sessions, and shared-ledger semantics out of scope.

**Non-Goals:**

- No auth/user ownership implementation.
- No redesign of the plans UI.
- No localStorage import/merge or legacy ID preservation.
- No broad transaction classification/category redesign beyond what generated installment transactions require.

## Decisions

1. **Use explicit action endpoints for ledger effects.** Generic plan CRUD can remain, but ledger-bearing operations should be named commands such as `POST /api/installments/:id/mark-paid` and `POST /api/installments/reconcile-due`.
2. **Backend computes due/future semantics.** Installment due dates and future-date guards belong in backend service logic with injectable time for tests.
3. **Generated transaction writes are idempotent.** Re-running the same effect must create at most one active generated transaction per plan installment index.
4. **Plan and transaction updates are atomic.** Paid-count updates and generated transaction reconciliation should commit or fail together where database transactions are available.
5. **Frontend maps results.** The frontend may display active/finished labels but should not apply canonical paid-count auto-sync or generated transaction side effects.

## Risks / Trade-offs

- Idempotency may require a Prisma/schema constraint or carefully tested repository logic.
- Existing hard/soft delete policies for generated transactions must be documented before implementation.
- Future auth/ownership scoping is deferred; this remains single-ledger.

## Migration Plan

1. Add backend contracts/services/routes for mark-paid and reconcile-due operations.
2. Add backend tests for due, future, retry/idempotency, delete/clear, and invalid references.
3. Add frontend HTTP methods and update plans page model to call backend actions.
4. Validate backend/frontend tests, builds, OpenSpec, and browser QA.
