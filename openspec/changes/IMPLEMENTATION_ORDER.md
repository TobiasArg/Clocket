# Frontend-to-Backend Implementation Order

This order is the active priority guide for the remaining backend-ownership OpenSpec roadmap. Implement and archive changes top-to-bottom unless a production blocker or explicit product decision changes priority.

Auth, sessions, authorization, `userId`, and shared-ledger behavior remain out of scope for this roadmap until `add-auth-user-ownership` is intentionally activated.

## Completed and archived

- `backend-owned-investment-market-refresh`
- `backend-owned-installment-ledger-effects`
- `backend-owned-budget-usage-read-models`
- `backend-owned-financial-analytics-read-models`
- `backend-owned-goal-progress-and-entry-resolution`
- `backend-owned-transaction-classification-and-category-constraints`
- `migrate-feature-domains-to-backend-api`

## P2 — Cleanup and hardening

1. `frontend-localstorage-repository-retirement`
   - Retire or quarantine legacy localStorage repositories from active runtime paths.
2. `backend-owned-exchange-rate-boundary`
   - Move canonical USD/ARS exchange-rate reads to a backend-owned boundary.
3. `settings-export-contract-hardening`
   - Harden full JSON export as a versioned backend-canonical backup contract.

## Future-gated

4. `add-auth-user-ownership`
   - Do not implement until product intentionally activates auth, sessions, authorization, `userId`, and shared-ledger decisions.

## Parallelization rules

- Do not implement two hardening changes in parallel unless their touched modules are isolated and both can pass full backend/frontend validation independently.
- P2 cleanup should proceed in the listed order unless a production blocker or explicit product decision changes priority.
- Keep auth/user ownership separate from P2 cleanup and hardening to avoid mixing critical persistence/security migration work with lower-risk cleanup.

## Validation baseline per implemented change

- `openspec validate <change-id> --strict --no-interactive`
- `npm --prefix backend test` and `npm --prefix backend run build` when backend changes are touched
- `npm --prefix frontend test` and `npm --prefix frontend run build` when frontend changes are touched
- Focused manual QA documented in the relevant `tasks.md`
