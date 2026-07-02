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
2. **Store original currency and convert on read.** Records keep their original currency; backend read models and frontend fallback displays convert on read for aggregates. Normalizing all persisted values to ARS or USD is rejected for now because it would lose original-entry semantics and expand migration scope.
3. **Backend read models own canonical aggregate math.** Frontend MAY compute fallback values while loading, but backend analytics/budget/goal responses MUST be the canonical source once available.
4. **Current-rate conversion is consistent and quiet in UI.** Aggregates with mixed currencies MUST convert to the requested/display currency using the backend exchange-rate boundary. If the backend falls back to the default rate, metadata remains available in the data boundary, but the UI will not show a warning in this iteration to keep the experience low-friction.
5. **Invalidation starts with simple explicit refetch/versioning.** Hooks SHOULD refetch or recompute on mutations, currency changes, and rate changes without adding SWR/React Query or a new store in this change.

## Risks / Trade-offs

- Existing users may have balances that already include prior transactions → migration notes/manual QA must verify no double counting.
- Using current FX rate for historical values is simple but not analytically perfect → leave historical FX out of scope and keep UI copy neutral.
- Silent fallback avoids UI anxiety but can hide quote freshness risk → keep backend metadata/test coverage so a later UX change can surface it if needed.
- Backend/frontend fallback calculations can diverge → tests should compare representative backend responses and frontend displays.

## Migration Plan

1. Add failing tests that reproduce account opening balance and mixed-currency aggregates.
2. Update backend read models and frontend fallbacks to use the documented contract.
3. Add invalidation triggers for mutations, currency changes, and exchange-rate refreshes.
4. Validate against existing fixtures and manual QA before archiving.
