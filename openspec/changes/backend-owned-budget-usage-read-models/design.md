## Context

Budget definitions are persisted in backend, but budget consumption remains a frontend read model. Current frontend logic matches backend transactions to budget scope rules and computes totals. This can diverge by client and creates duplicated financial definitions.

## Goals / Non-Goals

**Goals:**

- Provide backend usage endpoints for budget list and detail pages.
- Centralize scope matching and monthly expense aggregation in backend.
- Preserve frontend presentation while moving canonical usage values to backend.
- Keep auth/user ownership out of scope.

**Non-Goals:**

- No auth, sessions, authorization, `userId`, or shared ledgers.
- No broad analytics/statistics migration.
- No UI redesign.
- No localStorage import/merge.

## Decisions

1. **Expose usage as read models.** Budget CRUD remains separate from read-model endpoints such as `GET /api/budgets/usage?periodMonth=YYYY-MM` and `GET /api/budgets/:id/usage`.
2. **Backend owns scope matching.** All-subcategories, selected-subcategories, and no-subcategory behavior must be normalized and tested in backend.
3. **Usage derives from backend transactions.** The frontend must not be the canonical source of spent/progress values.
4. **Frontend remains presentation-only.** It may format currency, labels, and progress bars from backend values.
5. **Month semantics are explicit.** Endpoints validate month keys and compute deterministic date windows.

## Risks / Trade-offs

- Existing frontend and backend scope semantics must match during cutover.
- No-subcategory legacy behavior needs explicit tests.
- Usage response shape must avoid forcing a UI redesign.

## Migration Plan

1. Add backend contracts/service/routes/tests for usage list and detail.
2. Add frontend HTTP methods and map usage values to existing page models.
3. Validate with backend/frontend tests, builds, OpenSpec, and manual budget QA.
