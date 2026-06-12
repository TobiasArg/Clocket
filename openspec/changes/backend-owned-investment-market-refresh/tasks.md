## 1. Backend Refresh Orchestration

- [ ] 1.1 Add backend contracts for investment refresh request/response payloads, statuses, stale warnings, and provider error codes.
- [ ] 1.2 Add an investment market refresh service that resolves requested positions/assets, normalizes asset keys, and de-duplicates repeated assets within one request.
- [ ] 1.3 Implement backend same-UTC-day freshness checks and `force` behavior using injectable time for tests.
- [ ] 1.4 Reuse the Alpha Vantage provider/client contracts in-process and avoid internal HTTP calls to `/api/market/quote`.
- [ ] 1.5 Persist a new market quote snapshot and update daily/month refs when provider refresh succeeds.
- [ ] 1.6 Return stale fallback data from latest persisted snapshot when provider refresh fails and a snapshot exists.
- [ ] 1.7 Apply controlled non-forced cooldown behavior for throttled, invalid-symbol, and transient provider failures without introducing auth or durable distributed cache.
- [ ] 1.8 Add `POST /api/investments/positions/refresh` route/handler and method/payload validation.

## 2. Backend Tests and Validation

- [ ] 2.1 Test same-day snapshot skips provider when `force` is false.
- [ ] 2.2 Test forced refresh calls provider, persists snapshot, and updates refs.
- [ ] 2.3 Test multiple requested positions/assets with the same normalized asset use one provider refresh within the request.
- [ ] 2.4 Test throttled, invalid-symbol, network, and parse/provider failures return controlled stale fallback/cooldown responses without persisting invalid snapshots.
- [ ] 2.5 Test unsupported method, invalid payload, missing position, invalid asset type, and invalid ticker responses.
- [ ] 2.6 Validate backend stage with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Refresh Cutover

- [ ] 3.1 Add a frontend HTTP repository/client method for backend-owned investment refresh orchestration.
- [ ] 3.2 Update `refreshPositions` so investment refresh no longer imports or calls `fetchStockQuote`, `fetchCryptoRate`, or `MarketQuoteApiError` directly.
- [ ] 3.3 Map backend refresh statuses, snapshots, refs, stale warnings, and errors to existing `RefreshedPositionViewModel` behavior.
- [ ] 3.4 Preserve existing automatic/background refresh and manual forced refresh UX without redesigning the investments page.
- [ ] 3.5 Add/update frontend tests for backend refresh mapping, stale fallback, cooldown/error display, and force refresh behavior.
- [ ] 3.6 Validate frontend stage with `npm --prefix frontend test` and `npm --prefix frontend run build`.

## 4. Manual QA and Documentation

- [ ] 4.1 Manually verify investments page automatic refresh against backend with at least one stock and one crypto position when provider credentials are available.
- [ ] 4.2 Manually verify manual forced refresh sends `force: true` and updates persisted snapshot/ref state.
- [ ] 4.3 Manually verify provider failure or throttling keeps stale portfolio data visible with calm error/warning copy.
- [ ] 4.4 Document any remaining production-hardening gaps, especially durable cache/rate limiting and response payload sizing.

## 5. Final Verification

- [ ] 5.1 Run `openspec validate backend-owned-investment-market-refresh --strict --no-interactive` before implementation and before archival.
- [ ] 5.2 Run `npm --prefix backend test`.
- [ ] 5.3 Run `npm --prefix backend run build`.
- [ ] 5.4 Run `npm --prefix frontend test`.
- [ ] 5.5 Run `npm --prefix frontend run build`.
- [ ] 5.6 Confirm auth, sessions, authorization, `userId`, shared ledgers, localStorage import, and provider replacement remain out of scope.
