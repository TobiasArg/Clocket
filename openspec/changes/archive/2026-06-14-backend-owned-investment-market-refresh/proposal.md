## Why

Clocket now uses backend persistence for core finance and feature domains, including investments, market quote snapshots, asset refs, and app settings. However, the investment quote refresh orchestration still lives in the frontend domain flow: the browser decides when to call the market quote endpoint, applies per-asset cooldowns, persists snapshots, updates daily/month refs, and computes stale fallback state through multiple client-driven API calls.

That keeps a provider-sensitive financial workflow split across browser memory and backend persistence. Multiple tabs or future devices can duplicate provider requests, apply inconsistent cooldowns, or partially persist snapshot/ref changes. Moving this orchestration to the backend is the next minimal backend-owned step while keeping authentication and user ownership explicitly out of scope.

## What Changes

- Add a backend-owned investment market refresh service and API endpoint that refreshes investment assets/positions through backend services instead of browser-side provider orchestration.
- Centralize freshness checks, `force` behavior, provider fetches, snapshot persistence, daily/month ref updates, stale fallback, and per-request asset de-duplication in the backend.
- Preserve the existing `GET /api/market/quote` contract for direct quote use cases, but stop using it as the investment portfolio refresh orchestrator from the frontend.
- Cut over the investment frontend refresh flow so it calls the backend investment refresh endpoint and maps the response to existing portfolio display behavior.
- Keep the UI design, portfolio metric presentation, existing investment CRUD contracts, clean-start boundary, and backend canonical IDs unchanged unless strictly required for the refresh cutover.
- Non-goal: implement authentication, sessions, authorization, `userId` ownership, shared ledgers, or provider/vendor changes.
- Non-goal: introduce Redis, durable multi-instance rate limiting, a new market data provider, or a broad analytics/portfolio read-model rewrite in this change.

## Capabilities

### New Capabilities

- `backend-owned-market-refresh`: Backend orchestration for investment asset quote refresh, snapshots, refs, stale fallback, and per-request de-duplication.
- `frontend-investment-refresh-cutover`: Frontend investment refresh delegation to the backend-owned orchestration endpoint.
- `market-refresh-validation`: Automated/manual validation requirements for provider success, stale fallback, cooldown, mapping, and OpenSpec strict validation.

### Modified Capabilities

- None. Existing archived and canonical specs continue to define backend stability, clean-start, frontend regression, and manual QA expectations.

## Impact

- Backend: `backend/src/modules/investments/**`, `backend/src/modules/market/**`, `backend/src/providers/alpha-vantage/**`, `backend/pages/api/investments/**`, backend tests.
- Frontend: `frontend/src/domain/investments/refreshPositions.ts`, `frontend/src/data/http/investmentsRepository.ts`, investment hook/page-model tests, and any HTTP mapping helpers required for the new endpoint.
- API contract: a new investment refresh endpoint that returns latest snapshot/ref/stale state using backend persistence as canonical source of truth.
- Validation: backend tests/build, frontend tests/build, strict OpenSpec validation, and manual QA for automatic/forced investment refresh and provider failure fallback.
