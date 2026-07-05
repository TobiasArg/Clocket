## 1. Balance Contract

- [x] 1.1 Add tests proving account opening balance is included in Accounts, Home account slides, and backend home analytics.
- [x] 1.2 Update account balance calculations to use opening balance plus eligible transaction net flow.
- [x] 1.3 Document any migration caveat for accounts whose opening balance may already include historical transactions.

## 2. Currency Boundary

- [x] 2.1 Add backend tests for mixed USD/ARS transactions, budgets, goals, and analytics aggregates.
- [x] 2.2 Update backend aggregate services to convert values to the requested/display currency using the exchange-rate boundary.
- [x] 2.3 Update frontend display helpers/hooks so numeric values and symbols share the same currency basis.
- [x] 2.4 Preserve default/unavailable exchange-rate metadata at the data boundary while keeping UI fallback behavior silent for this iteration.

## 3. Analytics Freshness

- [x] 3.1 Replace array-length-only analytics invalidation with simple mutation/rate/currency-aware refetch or version invalidation.
- [x] 3.2 Add tests for editing a transaction amount/category without changing collection length.
- [x] 3.3 Add tests for currency setting changes and exchange-rate refreshes.

## 4. Validation

- [x] 4.1 Run `npm --prefix frontend test`.
- [x] 4.2 Run `npm --prefix frontend run typecheck` and `npm --prefix frontend run build`.
- [x] 4.3 Run `npm --prefix backend test`, `npm --prefix backend run typecheck`, and `npm --prefix backend run build`.
- [x] 4.4 Manually verify account balance, Home, Budgets, Goals, Cuotas, Statistics, and Settings currency switching.
- [x] 4.5 Run `openspec validate fix-financial-balance-and-currency-correctness --strict --no-interactive`.
