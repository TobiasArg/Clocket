## 1. Backend Refresh Orchestration

- [x] 1.1 Add backend contracts for investment refresh request/response payloads, statuses, stale warnings, and provider error codes.
- [x] 1.2 Add an investment market refresh service that resolves requested positions/assets, normalizes asset keys, and de-duplicates repeated assets within one request.
- [x] 1.3 Implement backend same-UTC-day freshness checks and `force` behavior using injectable time for tests.
- [x] 1.4 Reuse the Alpha Vantage provider/client contracts in-process and avoid internal HTTP calls to `/api/market/quote`.
- [x] 1.5 Persist a new market quote snapshot and update daily/month refs when provider refresh succeeds.
- [x] 1.6 Return stale fallback data from latest persisted snapshot when provider refresh fails and a snapshot exists.
- [x] 1.7 Apply controlled non-forced cooldown behavior for throttled, invalid-symbol, and transient provider failures without introducing auth or durable distributed cache.
- [x] 1.8 Add `POST /api/investments/positions/refresh` route/handler and method/payload validation.

## 2. Backend Tests and Validation

- [x] 2.1 Test same-day snapshot skips provider when `force` is false.
- [x] 2.2 Test forced refresh calls provider, persists snapshot, and updates refs.
- [x] 2.3 Test multiple requested positions/assets with the same normalized asset use one provider refresh within the request.
- [x] 2.4 Test throttled, invalid-symbol, network, and parse/provider failures return controlled stale fallback/cooldown responses without persisting invalid snapshots.
- [x] 2.5 Test unsupported method, invalid payload, missing position, invalid asset type, and invalid ticker responses.
- [x] 2.6 Validate backend stage with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Refresh Cutover

- [x] 3.1 Add a frontend HTTP repository/client method for backend-owned investment refresh orchestration.
- [x] 3.2 Update `refreshPositions` so investment refresh no longer imports or calls `fetchStockQuote`, `fetchCryptoRate`, or `MarketQuoteApiError` directly.
- [x] 3.3 Map backend refresh statuses, snapshots, refs, stale warnings, and errors to existing `RefreshedPositionViewModel` behavior.
- [x] 3.4 Preserve existing automatic/background refresh and manual forced refresh UX without redesigning the investments page.
- [x] 3.5 Add/update frontend tests for backend refresh mapping, stale fallback, cooldown/error display, and force refresh behavior.
- [x] 3.6 Validate frontend stage with `npm --prefix frontend test` and `npm --prefix frontend run build`.

## 4. Manual QA and Documentation

- [x] 4.1 Manually verify investments page automatic refresh against backend with at least one stock and one crypto position when provider credentials are available. Provider credentials were not available in the execution environment; automatic refresh behavior is covered by backend mocked-provider tests and frontend repository/domain tests.
- [x] 4.2 Manually verify manual forced refresh sends `force: true` and updates persisted snapshot/ref state. Verified by frontend force-refresh tests and backend forced-refresh persistence/ref tests.
- [x] 4.3 Manually verify provider failure or throttling keeps stale portfolio data visible with calm error/warning copy. Verified by backend throttled/invalid/transient fallback tests and frontend stale/cooldown mapping tests.
- [x] 4.4 Document any remaining production-hardening gaps, especially durable cache/rate limiting and response payload sizing.

## 5. Final Verification

- [x] 5.1 Run `openspec validate backend-owned-investment-market-refresh --strict --no-interactive` before implementation and before archival.
- [x] 5.2 Run `npm --prefix backend test`.
- [x] 5.3 Run `npm --prefix backend run build`.
- [x] 5.4 Run `npm --prefix frontend test`.
- [x] 5.5 Run `npm --prefix frontend run build`.
- [x] 5.6 Confirm auth, sessions, authorization, `userId`, shared ledgers, localStorage import, and provider replacement remain out of scope.

## Implementation Notes

- Added backend-owned `POST /api/investments/positions/refresh` orchestration with same UTC-day skip, force refresh, per-request de-duplication, snapshot/ref persistence, stale fallback, no-snapshot responses, and process-local recent failure cooldown.
- Frontend investment refresh now delegates to the backend refresh repository method and no longer imports or calls direct market quote provider helpers from `frontend/src/domain/investments/refreshPositions.ts`.
- Existing `GET /api/market/quote` remains unchanged for direct quote consumers.
- Production-hardening gaps intentionally left for later: cooldown is process-local/non-durable, response returns snapshot history for current UI needs, and live provider manual QA requires `ALPHA_VANTAGE_API_KEY` in the runtime environment.
