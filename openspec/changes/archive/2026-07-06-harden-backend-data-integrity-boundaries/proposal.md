## Why

The backend audit found integrity risks that can create inconsistent financial records even before auth/user ownership is activated: direct deletes can bypass resolution flows, installment paid counts can diverge from ledger transactions, GET endpoints can create records, and validation gaps can produce uncontrolled errors.

## What Changes

- Require backend destructive operations to preserve referential and business-rule integrity.
- Make installment ledger effects idempotent under retries/concurrency.
- Prohibit read endpoints from creating investment reference data as a side effect.
- Harden validation for dates, decimal ranges, positive amounts, tickers, and unsupported methods.
- Non-goal: auth/user ownership, role-based authorization, shared ledgers, or broad database redesign.

## Capabilities

### New Capabilities

- `backend-data-integrity-boundaries`: Backend validation, idempotency, destructive-action, and side-effect boundary requirements.

### Modified Capabilities

- None.

## Impact

- Backend modules: goals, installments, accounts, categories, budgets, investments, settings, shared API validation helpers, Prisma schema/tests.
- Frontend: only if API error contracts or user-facing flows need minor adjustment.
- Validation: backend tests/build, optional DB smoke, focused API manual QA.
