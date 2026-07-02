## 1. Balance Contract

- [ ] 1.1 Add tests proving account opening balance is included in Accounts, Home account slides, and backend home analytics.
- [ ] 1.2 Update account balance calculations to use opening balance plus eligible transaction net flow.
- [ ] 1.3 Document any migration caveat for accounts whose opening balance may already include historical transactions.

## 2. Currency Boundary

- [ ] 2.1 Add backend tests for mixed USD/ARS transactions, budgets, goals, and analytics aggregates.
- [ ] 2.2 Update backend aggregate services to convert values to the requested/display currency using the exchange-rate boundary.
- [ ] 2.3 Update frontend display helpers/hooks so numeric values and symbols share the same currency basis.
- [ ] 2.4 Surface default/unavailable exchange-rate metadata where a fallback rate affects displayed money.

## 3. Analytics Freshness

- [ ] 3.1 Replace array-length-only analytics invalidation with mutation/rate/currency-aware invalidation.
- [ ] 3.2 Add tests for editing a transaction amount/category without changing collection length.
- [ ] 3.3 Add tests for currency setting changes and exchange-rate refreshes.

## 4. Validation

- [ ] 4.1 Run `npm --prefix frontend test`.
- [ ] 4.2 Run `npm --prefix frontend run typecheck` and `npm --prefix frontend run build`.
- [ ] 4.3 Run `npm --prefix backend test`, `npm --prefix backend run typecheck`, and `npm --prefix backend run build`.
- [ ] 4.4 Manually verify account balance, Home, Budgets, Goals, Cuotas, Statistics, and Settings currency switching.
- [ ] 4.5 Run `openspec validate fix-financial-balance-and-currency-correctness --strict --no-interactive`.
