# Frontend-to-Backend Implementation Order

This order is the active priority guide for the backend-ownership OpenSpec roadmap. Implement and archive changes top-to-bottom unless a production blocker or explicit product decision changes priority.

Auth, sessions, authorization, `userId`, and shared-ledger behavior remain out of scope for this roadmap until `add-auth-user-ownership` is intentionally activated.

## P0 — Implement first

1. `backend-owned-investment-market-refresh`
   - Move investment quote refresh orchestration, snapshots, refs, stale fallback, and cooldown behavior to backend.
2. `backend-owned-installment-ledger-effects`
   - Move cuota paid-count transitions and generated transaction ledger effects to backend.
3. `backend-owned-budget-usage-read-models`
   - Move budget usage, scope matching, progress, overspent, and detail read models to backend.

## P1 — Implement after P0 stabilizes

4. `backend-owned-financial-analytics-read-models`
   - Move home/statistics financial analytics read models to backend.
   - Status: implemented and validated on 2026-06-19; ready for archive when the change is finalized.
5. `backend-owned-goal-progress-and-entry-resolution`
   - Move goal progress, edit propagation, and linked-entry delete/redirect resolution to backend.
6. `backend-owned-transaction-classification-and-category-constraints`
   - Move transaction classification and category/subcategory constraints to backend.

## P2 — Cleanup and hardening

7. `frontend-localstorage-repository-retirement`
   - Retire or quarantine legacy localStorage repositories from active runtime paths.
8. `backend-owned-exchange-rate-boundary`
   - Move canonical USD/ARS exchange-rate reads to a backend-owned boundary.
9. `settings-export-contract-hardening`
   - Harden full JSON export as a versioned backend-canonical backup contract.

## Parallelization rules

- Do not implement two P0 changes in parallel unless their touched modules are isolated and both can pass full backend/frontend validation independently.
- P1 work should not start until `backend-owned-investment-market-refresh`, `backend-owned-installment-ledger-effects`, and `backend-owned-budget-usage-read-models` are implemented or explicitly deferred.
- P2 cleanup should wait until its dependencies are stable, especially localStorage retirement after all active backend cutovers stop needing legacy repositories.

## Validation baseline per implemented change

- `openspec validate <change-id> --strict --no-interactive`
- `npm --prefix backend test` and `npm --prefix backend run build` when backend changes are touched
- `npm --prefix frontend test` and `npm --prefix frontend run build` when frontend changes are touched
- Focused manual QA documented in the relevant `tasks.md`
