## Context

The feature-domain backend cutover moved investments to backend-backed positions, entries, snapshots, and refs. The stabilization archive verified live API and browser flows, including snapshots/refs and provider refresh request stability. The remaining architectural gap is that investment quote refresh orchestration is still browser-owned in `frontend/src/domain/investments/refreshPositions.ts`.

Today the frontend:

- reads latest snapshots and refs from the investment HTTP repository;
- decides freshness by UTC day;
- applies `force` locally;
- calls `fetchStockQuote` / `fetchCryptoRate` from `marketQuoteApiClient`;
- writes snapshots through the investments repository;
- updates daily and monthly refs through separate requests;
- maintains an in-memory recent failure cooldown per tab;
- falls back to the latest snapshot or buy price if the provider fails.

The backend already has the provider adapter, market quote contracts, investment repositories, snapshots, and refs. This change adds the missing use-case boundary: investment market refresh as one backend-owned operation.

## Goals / Non-Goals

**Goals:**

- Move provider-sensitive investment refresh orchestration from frontend domain logic into backend services.
- Keep Next.js API Routes and existing TypeScript service/module boundaries.
- Reuse existing Alpha Vantage provider contracts and investment persistence models.
- Preserve backend snapshots/refs as canonical persistence for refreshed market data.
- Preserve existing investment UI behavior by mapping backend refresh results to the current portfolio view model.
- Keep auth, ownership, sessions, and multi-user access control out of scope.

**Non-Goals:**

- No authentication, authorization, `userId`, session, or shared-ledger implementation.
- No change of quote provider or provider subscription model.
- No Redis, durable distributed rate limiter, or multi-instance cache in this first cut.
- No broad portfolio analytics migration; frontend may continue computing display metrics from backend refresh data.
- No UI redesign or new investment product feature beyond backend-owned refresh orchestration.
- No localStorage import, data merge, or legacy ID preservation.

## Decisions

### Decision 1: Add an investments refresh endpoint rather than expanding `/api/market/quote`

The new orchestration endpoint should live under investments, e.g. `POST /api/investments/positions/refresh`, because the operation is not just a direct quote lookup. It resolves positions/assets, applies portfolio freshness rules, writes snapshots, updates refs, and returns stale fallback state.

The existing `GET /api/market/quote` remains available for direct quote consumers and compatibility tests.

### Decision 2: Backend refresh service uses provider/service dependencies in-process

The investment refresh service should reuse the Alpha Vantage provider/client contracts directly rather than making HTTP calls to the backend's own `/api/market/quote` route. This keeps route handlers thin, avoids internal HTTP overhead, and allows focused unit tests with injected provider/repository/time dependencies.

### Decision 3: Per-request de-duplication is required; durable cooldown is deferred

The backend must refresh a normalized `assetType:ticker` at most once per refresh request, even when multiple positions reference the same asset. A lightweight in-process recent failure cooldown is acceptable for this change if it mirrors existing UX and is covered by tests, but durable cross-instance cooldown/cache remains a future production-hardening item.

### Decision 4: Backend owns freshness, stale fallback, snapshots, and refs

Backend refresh owns:

- same UTC-day freshness check;
- `force` behavior;
- provider error mapping;
- stale fallback to latest snapshot when available;
- snapshot creation on provider success;
- daily/month ref updates when appropriate;
- response status for skipped, refreshed, cooldown, stale fallback, and no snapshot cases.

Frontend should no longer call market quote provider endpoints directly from investment refresh domain flow.

### Decision 5: Frontend keeps display metric composition for now

To keep the change minimal, frontend may continue using current portfolio metric and historical-series helpers after receiving refreshed backend data. A later analytics/read-model change can move portfolio metrics server-side if needed.

## Proposed API Shape

Endpoint:

```http
POST /api/investments/positions/refresh
```

Request:

```ts
interface RefreshInvestmentPositionsRequest {
  positionIds?: string[];
  assets?: Array<{
    assetType: "stock" | "crypto";
    ticker: string;
  }>;
  force?: boolean;
}
```

Rules:

- At least one `positionIds` item or one `assets` item is required.
- `positionIds` resolve backend-canonical active positions.
- `assets` are normalized by backend using the same asset type/ticker validation used elsewhere.
- `force: false` respects same-day freshness and active cooldown.
- `force: true` bypasses same-day freshness and recent cooldown, but does not bypass provider validation or hard failures.

Response:

```ts
interface RefreshInvestmentPositionsResponse {
  refreshedAt: string;
  results: Array<{
    positionId: string | null;
    assetType: "stock" | "crypto";
    ticker: string;
    currentPrice: string | null;
    lastUpdatedTimestamp: string | null;
    status: "refreshed" | "skipped_fresh" | "stale_fallback" | "cooldown" | "no_snapshot";
    staleWarning: string | null;
    refreshError: string | null;
    errorCode: string | null;
    latestSnapshot: unknown | null;
    refs: unknown | null;
    snapshots: unknown[];
  }>;
}
```

The implementation may refine `unknown` to existing investment snapshot/ref response contracts. Decimal values should follow existing backend serialization conventions and be mapped at the frontend data boundary.

## Risks / Trade-offs

- **In-memory cooldown is not durable**: acceptable for this phase, but document as production hardening for later cache/rate-limit work.
- **Response payload size**: returning full snapshot history can grow; implementation should prefer only the data needed by the current UI or cap history if needed.
- **Duplicate logic during cutover**: avoid leaving frontend provider calls active in `refreshPositions` after backend endpoint lands.
- **Decimal mapping**: backend Decimal/string payloads must map back to current numeric portfolio display shapes.
- **Provider throttling**: forced refresh can increase Alpha Vantage usage; backend tests must assert cooldown behavior for non-forced flows.
- **Auth boundary**: endpoint remains single-ledger until `add-auth-user-ownership` is implemented; do not add user ownership semantics in this change.

## Migration Plan

1. Add backend refresh contracts, service, handler, route, and tests with injected provider/repository/time dependencies.
2. Reuse investment repository methods for snapshots/refs and market provider contracts for quote fetches.
3. Add frontend HTTP refresh method and map backend refresh responses to existing `refreshPositions` output.
4. Remove direct investment refresh imports of `fetchStockQuote`, `fetchCryptoRate`, and `MarketQuoteApiError` from the investment domain flow.
5. Validate backend tests/build, frontend tests/build, strict OpenSpec validation, and manual investment refresh QA.

Rollback strategy: revert the frontend refresh cutover to the prior browser-side orchestration and leave the backend endpoint dormant if needed. No data import/merge or schema rollback should be required for the first implementation if no Prisma migration is introduced.

## Open Questions

- Should the first implementation return full snapshot history or only latest snapshot/refs plus enough data for the frontend to re-fetch history separately?
- Should provider failure cooldown remain process-local only, or should a minimal persisted cooldown table be introduced in a later production-hardening change?
- Should a future analytics/read-model spec move portfolio metric computation server-side after this refresh orchestration cutover?
