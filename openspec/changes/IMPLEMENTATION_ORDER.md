# Clocket OpenSpec Implementation Order

This order is the active priority guide for the current OpenSpec roadmap after the July product/technical audit. Implement and archive changes top-to-bottom unless a production blocker or explicit product decision changes priority.

Auth, sessions, authorization, `userId`, and shared-ledger behavior remain out of scope for this roadmap until `add-auth-user-ownership` is intentionally activated.

`openspec list --json` reports all active changes as `in-progress`; priority and gating are governed by this document, not by list order.

## Completed and archived

- `backend-owned-investment-market-refresh`
- `backend-owned-installment-ledger-effects`
- `backend-owned-budget-usage-read-models`
- `backend-owned-financial-analytics-read-models`
- `backend-owned-goal-progress-and-entry-resolution`
- `backend-owned-transaction-classification-and-category-constraints`
- `migrate-feature-domains-to-backend-api`
- `frontend-localstorage-repository-retirement`
- `backend-owned-exchange-rate-boundary`
- `settings-export-contract-hardening`

## P0 — Roadmap correctness and financial correctness

1. `repair-openspec-roadmap-state`
   - Repair stale OpenSpec context/order, complete canonical spec purposes, and add traceability for future changes.
   - This is first because it aligns planning artifacts before runtime changes.

2. `fix-financial-balance-and-currency-correctness`
   - Correct account opening-balance handling, USD/ARS aggregate conversion, and analytics freshness.
   - This is highest product/runtime priority because it affects user trust in financial values.

## P1 — Security exposure and backend integrity

3. `harden-settings-security-export`
   - Redact PIN verifier material from settings reads/exports and improve domain-aware export errors.

4. `harden-backend-data-integrity-boundaries`
   - Harden destructive actions, installment idempotency, validation, and read endpoint side-effect boundaries.

## P2 — Delivery confidence and accessibility/product quality

5. `harden-ci-quality-gates`
   - Add CI gates for frontend, backend, OpenSpec, and DB smoke validation.

6. `improve-accessible-finance-ui-foundations`
   - Improve dialog/sheet semantics, delete accessibility, app landmarks, live regions, and calm Spanish copy.

## Future-gated

7. `add-auth-user-ownership`
   - Active OpenSpec artifact only; current implementation state is 0/25 tasks complete.
   - Do not implement, archive, or partially modify until product intentionally activates auth, sessions, authorization, `userId`, and shared-ledger decisions.

## Parallelization rules

- Do not implement two hardening changes in parallel unless their touched modules are isolated and both can pass full backend/frontend validation independently.
- Runtime financial correctness work takes priority over polish unless a security exposure or CI blocker is actively preventing delivery.
- Keep auth/user ownership separate from the audit-driven hardening roadmap to avoid mixing critical persistence/security migration work with lower-risk cleanup.

## Validation baseline per implemented change

- `openspec validate <change-id> --strict --no-interactive`
- `npm --prefix backend test` and `npm --prefix backend run build` when backend changes are touched
- `npm --prefix frontend test` and `npm --prefix frontend run build` when frontend changes are touched
- Focused manual QA documented in the relevant `tasks.md`
