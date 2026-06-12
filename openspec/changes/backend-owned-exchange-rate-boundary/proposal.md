## Why

Currency conversion currently depends on frontend fixed-rate behavior. Exchange rates affect financial values and should come from a documented backend boundary before broader multi-device or production use.

## What Changes

- Add a backend-owned exchange-rate boundary for supported currency pairs, starting with USD to ARS.
- Replace canonical frontend fixed-rate usage with backend-provided rate data and explicit fallback state.
- Preserve current ARS/USD UI behavior while making rate source, timestamp, and stale/default state explicit.
- Non-goal: auth, user ownership, multi-user settings, provider replacement beyond the selected first source, or historical FX analytics.

## Capabilities

### New Capabilities

- `backend-owned-exchange-rate-boundary`: Backend-owned exchange-rate read boundary for financial conversion flows.

### Modified Capabilities

- None.

## Impact

- Backend: new exchange-rate service/route/tests or extension of market/provider boundaries.
- Frontend: currency conversion helpers, HTTP client/mapping tests.
- Validation: backend/frontend tests/build and OpenSpec validation.
