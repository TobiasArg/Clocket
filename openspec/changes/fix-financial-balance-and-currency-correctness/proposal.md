## Why

The product audit found high-risk financial correctness gaps: account opening balances are not reflected consistently, USD/ARS values can be summed without conversion, and dashboard/statistics analytics can remain stale after edits. Clocket must make financial summaries trustworthy before further product expansion.

## What Changes

- Define one canonical balance contract for accounts, Home, and backend analytics.
- Define a canonical money/currency boundary for USD/ARS conversion across backend read models and frontend display.
- Require analytics freshness after create, update, delete, settings currency changes, and exchange-rate refreshes.
- Add tests/manual QA expectations that prove balances and currency labels represent the same numeric basis.
- Non-goal: authentication, user ownership, shared ledgers, historical FX analytics, import/restore, or advanced investment tax/accounting calculations.

## Capabilities

### New Capabilities

- `financial-balance-and-currency-correctness`: Canonical account balance, money conversion, and analytics freshness requirements.

### Modified Capabilities

- None.

## Impact

- Frontend: account/home/statistics/budgets/goals/cuotas hooks, currency context, money formatting utilities, tests.
- Backend: analytics, budget usage, goal progress, transaction/account read models, exchange-rate usage boundaries, tests.
- Validation: frontend/backend tests, builds, focused money conversion tests, and manual QA for account balance + currency switching.
