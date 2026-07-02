## Context

Clocket has moved core finance data to backend-owned HTTP repositories, but some frontend and backend summaries still derive balances from transaction flows alone or sum mixed-currency amounts as plain numbers. The current exchange-rate boundary provides USD/ARS, but not every aggregate explicitly depends on the canonical rate or invalidates when that rate changes.

## Goals / Non-Goals

**Goals:**

- Make account balances, Home cards, account slides, budgets, goals, and statistics use one documented money basis.
- Ensure `Account.balance` is either included in displayed balances or intentionally deprecated in favor of ledger-derived balances; this change chooses inclusion as the current product contract because account creation asks for an opening balance.
- Normalize backend and frontend conversion behavior so USD/ARS aggregates do not mix raw values.
- Refresh/recompute analytics after edits and after currency/rate state changes.

**Non-Goals:**

- No auth, sessions, user ownership, shared ledgers, import/restore, or localStorage import.
- No historical exchange-rate analytics; current canonical rate is sufficient for this change.
- No new external state library unless existing hooks cannot support deterministic invalidation.

## Decisions

1. **Balance contract includes opening balance.** Displayed account balance SHALL be opening balance plus non-saving transaction net flow. Alternative ledger-only was rejected because the product currently asks users for an initial account balance.
2. **Backend read models own canonical aggregate math.** Frontend MAY compute fallback values while loading, but backend analytics/budget/goal responses MUST be the canonical source once available.
3. **Current-rate conversion is explicit.** Aggregates with mixed currencies MUST convert to the requested/display currency using the backend exchange-rate boundary and expose fallback/unavailable metadata when the rate is defaulted.
4. **Invalidation is event/version based, not array-length based.** Hooks SHOULD refetch or recompute on mutations, currency changes, and rate changes, not only on item count changes.

## Risks / Trade-offs

- Existing users may have balances that already include prior transactions → migration notes/manual QA must verify no double counting.
- Using current FX rate for historical values is simple but not analytically perfect → label as current-rate conversion and leave historical FX out of scope.
- Backend/frontend fallback calculations can diverge → tests should compare representative backend responses and frontend displays.

## Migration Plan

1. Add failing tests that reproduce account opening balance and mixed-currency aggregates.
2. Update backend read models and frontend fallbacks to use the documented contract.
3. Add invalidation triggers for mutations, currency changes, and exchange-rate refreshes.
4. Validate against existing fixtures and manual QA before archiving.
