## 1. Destructive Integrity

- [ ] 1.1 Add tests for deleting goals/accounts/categories with active linked records.
- [ ] 1.2 Require explicit resolution or controlled rejection for destructive operations that would leave inconsistent active data.
- [ ] 1.3 Ensure bulk delete/reset endpoints are documented and guarded for current single-profile scope.

## 2. Installment Idempotency

- [ ] 2.1 Add tests for repeated and concurrent installment mark-paid calls.
- [ ] 2.2 Add service guards and DB uniqueness to prevent duplicate installment ledger transactions.
- [ ] 2.3 Prevent direct paid-count updates from bypassing ledger effects.

## 3. Validation and Side Effects

- [ ] 3.1 Harden validation for `periodMonth`, positive amounts, decimal ranges, and ticker formats.
- [ ] 3.2 Convert expected validation failures into structured 4xx responses.
- [ ] 3.3 Remove state creation side effects from GET/read investment reference endpoints.

## 4. Validation

- [ ] 4.1 Run `npm --prefix backend test`, `npm --prefix backend run typecheck`, `npm --prefix backend run prisma:validate`, and `npm --prefix backend run build`.
- [ ] 4.2 Run DB smoke tests with `RUN_DB_TESTS=1` when Docker/PostgreSQL is available.
- [ ] 4.3 Run focused API manual QA for destructive operations, installments, invalid inputs, and investment refs.
- [ ] 4.4 Run `openspec validate harden-backend-data-integrity-boundaries --strict --no-interactive`.
