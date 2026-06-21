## Context

Home and statistics pages currently compute financial summaries in frontend page models. Backend persistence is now canonical, so analytics definitions should move to backend read models while the frontend remains presentation-focused.

## Goals / Non-Goals

**Goals:**

- Provide backend analytics endpoints for home and statistics views.
- Define canonical income/expense/savings, category grouping, monthly windows, and trend bucket calculations in backend.
- Preserve existing UI cards/charts and local UI preferences.
- Keep auth/user ownership out of scope.

**Non-Goals:**

- No auth, sessions, authorization, `userId`, or shared ledgers.
- No import/export implementation.
- No UI redesign or data visualization rewrite.
- No materialized analytics tables in the first implementation unless tests prove necessary.

## Decisions

1. **Add analytics endpoints.** Use endpoints such as `GET /api/analytics/home` and `GET /api/analytics/statistics` rather than expanding transaction CRUD.
2. **Backend owns financial definitions.** Income, expense, savings, net, category grouping, and goal progress are canonical backend rules.
3. **Date buckets are explicit.** Responses include stable bucket keys/ranges; frontend may localize labels.
4. **Scope preference remains frontend-local.** Statistics scope selection can remain UI-only local state for now.
5. **Single-ledger only.** Future user scoping is deferred to auth/ownership specs.

## Risks / Trade-offs

- Existing frontend charts expect specific shapes; mapper tests are required.
- Goal savings inclusion/exclusion must be specified to avoid metric drift.
- Large datasets can be optimized later; first implementation may compute on demand.

## Migration Plan

1. Add backend analytics contracts/services/routes/tests.
2. Add frontend HTTP client/mappers and page-model cutover.
3. Compare fixed fixture outputs before/after cutover.
4. Validate tests/builds/OpenSpec and manual dashboard/statistics QA.
