## QA Notes

Date: 2026-07-06

## Implementation evidence

### Destructive integrity

- `DELETE /api/accounts/:id` now rejects active accounts with active transactions using structured `409 ACCOUNT_IN_USE`.
- `DELETE /api/goals/:id` now rejects goals with active linked transactions using structured `409 GOAL_IN_USE`.
- `DELETE /api/goals` now rejects bulk deletion when any active goal still has active linked transactions.
- Existing category delete/subcategory replacement guards continue to reject active linked records with `CATEGORY_IN_USE` / `SUBCATEGORY_IN_USE`.
- Explicit goal deletion resolution remains available through `POST /api/goals/:id/resolve-deletion`.

Focused coverage:

- `backend/src/modules/accounts/accountsRepository.test.ts`
- `backend/src/modules/accounts/accountsService.test.ts`
- `backend/src/modules/accounts/accountsApiHandler.test.ts`
- `backend/src/modules/goals/goalsRepository.test.ts`
- `backend/src/modules/goals/goalsApiHandler.test.ts`
- `backend/src/modules/categories/categoriesRepository.test.ts`

### Installment idempotency

- Installment generated ledger effects now use atomic `createMany(..., skipDuplicates: true)`.
- Active generated ledger transactions are protected by PostgreSQL partial unique index:
  - `transactions_active_installment_effect_unique`
  - `(installmentPlanId, cuotaInstallmentIndex)` when both are non-null and `deletedAt IS NULL`.
- `markNextDuePaid` and `reconcileDue` use monotonic `updateMany` guards so stale updates cannot lower `paidInstallmentsCount`.
- Public PATCH rejects direct `paidInstallmentsCount` mutation; count changes must go through ledger effect endpoints.
- Creating a plan with non-zero `paidInstallmentsCount` requires `generatedTransactionAccountId` so ledger effects are materialized.

Focused coverage:

- `backend/src/modules/installments/installmentPlansRepository.test.ts`
- `backend/src/modules/installments/installmentPlansService.test.ts`
- `backend/src/modules/installments/installmentPlansApiHandler.test.ts`
- `backend/src/modules/installments/installmentLedgerEffectsService.test.ts`

### Validation and side-effect boundaries

- Shared decimal validation now enforces finite numeric input, precision, scale, and positive-only semantics where required.
- `periodMonth` list queries are validated before repository reads.
- Budget, goal, installment, transaction, account, and investment inputs are rejected before persistence when amounts are outside expected range/scale/sign rules.
- Investment tickers now use the same format rule as market quote (`^[A-Z][A-Z0-9.-]{0,14}$`).
- `GET /api/investments/refs?assetType=...&ticker=...` is read-only and returns structured `404 NOT_FOUND` when refs do not exist instead of creating asset/ref records.
- Ref initialization remains in explicit write/refresh paths.

Focused coverage:

- `backend/src/modules/core-finance/coreFinanceRequest.test.ts`
- `backend/src/modules/budgets/budgetsService.test.ts`
- `backend/src/modules/transactions/transactionsService.test.ts`
- `backend/src/modules/goals/goalsService.test.ts`
- `backend/src/modules/investments/investmentsService.test.ts`
- `backend/src/modules/investments/investmentsRepository.test.ts`
- `backend/src/modules/investments/investmentMarketRefreshService.test.ts`

## Validation commands

Passed:

```bash
npm --prefix backend test
npm --prefix backend run typecheck
npm --prefix backend run prisma:validate
npm --prefix backend run build
openspec validate harden-backend-data-integrity-boundaries --strict --no-interactive
```

Note: one initial parallel `typecheck` attempt failed because concurrent `prisma generate` commands raced over generated files while backend tests were running. The command passed when rerun sequentially.

## DB smoke

`RUN_DB_TESTS=1` smoke was not runnable because Docker daemon/PostgreSQL was not available in this environment:

```text
failed to connect to the docker API at unix:///Users/argtobias/.docker/run/docker.sock
```

The non-DB backend suite includes the smoke file with DB-gated test skipped when `RUN_DB_TESTS` is not set.

## Focused manual QA checklist

Use these API checks against a local backend with seeded active records:

1. Create account + active transaction, then `DELETE /api/accounts/:id` → `409 ACCOUNT_IN_USE`.
2. Create goal + active saving transaction, then `DELETE /api/goals/:id` → `409 GOAL_IN_USE`.
3. Use `POST /api/goals/:id/resolve-deletion` with `delete_entries` → linked entries resolved and goal deleted.
4. With any active goal-linked transaction, `DELETE /api/goals` → `409 GOAL_IN_USE`.
5. Retry/concurrently call `POST /api/installments/:id/mark-paid` for the same due index → at most one active generated ledger transaction for that plan/index.
6. `PATCH /api/installments/:id` with `paidInstallmentsCount` → structured `400 INVALID_REQUEST`.
7. `GET /api/budgets?periodMonth=2026-13` → structured `400 INVALID_REQUEST`.
8. POST/PATCH with invalid decimal scale/range/positive-only money fields → structured `400 INVALID_REQUEST` before persistence.
9. POST/PATCH investment with ticker `***` → structured `400 INVALID_TICKER`.
10. `GET /api/investments/refs?assetType=stock&ticker=UNKNOWN` → structured `404 NOT_FOUND` and no asset/ref rows created.
