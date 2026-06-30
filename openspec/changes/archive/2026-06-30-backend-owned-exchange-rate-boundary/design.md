## Context

Frontend constants are currently enough for display fallback, but they should not remain the canonical exchange-rate source as persistence becomes backend-owned.

## Goals / Non-Goals

**Goals:**

- Backend provides canonical exchange-rate data for supported pairs.
- Frontend uses backend rate metadata for financial conversion paths.
- Fallback/default rates are explicit, not silent canonical values.

**Non-Goals:**

- No auth/user ownership.
- No historical FX analytics.
- No broad provider replacement beyond the first selected rate source.

## Decisions

1. **Start with USD→ARS.** This is the current conversion path.
2. **Response includes provenance.** Include base/quote currency, rate, source, timestamp, and stale/default flags.
3. **Frontend fallback is non-canonical.** Fixed frontend helpers can remain only as display-safe fallback.
4. **App-level reference data.** Rates are not user-owned in this phase.

## Risks / Trade-offs

- A backend provider/source decision is required during implementation.
- Existing tests may assume fixed rates and need fixture injection.
- Fallback copy must avoid overstating freshness.

## Migration Plan

1. Add backend contracts/service/route/tests for exchange rates.
2. Add frontend HTTP consumption and replace canonical fixed-rate callers.
3. Add tests proving fixed frontend constants are fallback-only.
