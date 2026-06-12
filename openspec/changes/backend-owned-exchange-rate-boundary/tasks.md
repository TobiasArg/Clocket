## 1. Backend Exchange Rate Boundary

- [ ] 1.1 Add backend exchange-rate contracts for supported pairs, response source, timestamps, stale/default flags, and error codes.
- [ ] 1.2 Add backend service logic for USD to ARS rate resolution using the selected initial source.
- [ ] 1.3 Add `GET /api/exchange-rates` or pair-specific route/handler with method and query validation.
- [ ] 1.4 Return controlled fallback/default state when the configured source is unavailable.
- [ ] 1.5 Keep rate behavior independent from auth, sessions, authorization, and user ownership.

## 2. Frontend Rate Consumption

- [ ] 2.1 Add frontend HTTP client/repository method for backend exchange-rate reads.
- [ ] 2.2 Replace canonical fixed-rate usage in migrated financial conversion paths.
- [ ] 2.3 Map backend rate metadata to UI-safe conversion helpers.
- [ ] 2.4 Preserve existing ARS/USD UI formatting and calm fallback behavior.

## 3. Tests

- [ ] 3.1 Add backend tests for valid pair, unsupported pair, source failure, fallback/default state, and unsupported method.
- [ ] 3.2 Add frontend tests for rate fetch mapping, fallback behavior, and conversion callers.
- [ ] 3.3 Add regression coverage preventing fixed frontend constants from acting as canonical exchange-rate source.

## 4. Validation

- [ ] 4.1 Run `npm --prefix backend test` and `npm --prefix backend run build`.
- [ ] 4.2 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [ ] 4.3 Run `openspec validate backend-owned-exchange-rate-boundary --strict --no-interactive`.
- [ ] 4.4 Confirm auth, sessions, authorization, user ownership, and historical FX analytics remain out of scope.
