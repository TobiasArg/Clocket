## 1. Destructive Integrity

- [x] 1.1 Add tests for deleting goals/accounts/categories with active linked records.
- [x] 1.2 Require explicit resolution or controlled rejection for destructive operations that would leave inconsistent active data.
- [x] 1.3 Ensure bulk delete/reset endpoints are documented and guarded for current single-profile scope.

## 2. Installment Idempotency

- [x] 2.1 Add tests for repeated and concurrent installment mark-paid calls.
- [x] 2.2 Add service guards and DB uniqueness to prevent duplicate installment ledger transactions.
- [x] 2.3 Prevent direct paid-count updates from bypassing ledger effects.

## 3. Validation and Side Effects

- [x] 3.1 Harden validation for `periodMonth`, positive amounts, decimal ranges, and ticker formats.
- [x] 3.2 Convert expected validation failures into structured 4xx responses.
- [x] 3.3 Remove state creation side effects from GET/read investment reference endpoints.

## 4. Validation

- [x] 4.1 Run `npm --prefix backend test`, `npm --prefix backend run typecheck`, `npm --prefix backend run prisma:validate`, and `npm --prefix backend run build`.
- [x] 4.2 Run DB smoke tests with `RUN_DB_TESTS=1` when Docker/PostgreSQL is available.
- [x] 4.3 Run focused API manual QA for destructive operations, installments, invalid inputs, and investment refs.
- [x] 4.4 Run `openspec validate harden-backend-data-integrity-boundaries --strict --no-interactive`.
