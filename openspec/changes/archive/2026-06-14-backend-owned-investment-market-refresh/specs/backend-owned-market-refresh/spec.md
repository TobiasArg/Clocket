## ADDED Requirements

### Requirement: Investment quote refresh orchestration is backend-owned
The backend SHALL own investment quote refresh orchestration for requested investment positions or assets, including freshness checks, provider fetches, snapshot persistence, daily/month reference updates, stale fallback behavior, and per-request asset de-duplication.

#### Scenario: Fresh snapshot skips provider call
- **WHEN** a refresh request targets an asset whose latest snapshot belongs to the current UTC day and `force` is false
- **THEN** the backend SHALL NOT call the market quote provider
- **AND** SHALL return the latest persisted snapshot, refs, and a skipped/fresh status for that asset

#### Scenario: Forced refresh calls provider
- **WHEN** a refresh request targets an asset and `force` is true
- **THEN** the backend SHALL call the market quote provider regardless of same-day snapshot freshness or recent non-forced cooldown
- **AND** on provider success the backend SHALL persist a new snapshot and update daily/month refs when applicable

#### Scenario: Multiple positions share one asset refresh
- **WHEN** a refresh request includes multiple positions or assets with the same normalized `assetType` and `ticker`
- **THEN** the backend SHALL perform at most one provider refresh for that normalized asset within the request
- **AND** SHALL return refresh results for each requested position or asset target

### Requirement: Refresh failures preserve stale portfolio usability
The backend SHALL preserve stale portfolio usability when provider refresh fails by returning controlled fallback state rather than crashing or discarding existing persisted market data.

#### Scenario: Provider throttles quote request
- **WHEN** the market quote provider returns a throttling response during investment refresh
- **THEN** the backend SHALL return latest persisted snapshot/ref data when available
- **AND** SHALL include a controlled throttling code, stale warning, and stale fallback or cooldown status

#### Scenario: Provider rejects invalid symbol
- **WHEN** the market quote provider rejects a ticker as invalid
- **THEN** the backend SHALL NOT persist an invalid snapshot
- **AND** SHALL return controlled invalid-symbol state with stale fallback data when available

#### Scenario: Cooldown prevents repeated provider calls
- **WHEN** a non-forced refresh request targets an asset with an active recent failure cooldown
- **THEN** the backend SHALL NOT call the provider again for that asset
- **AND** SHALL return a controlled cooldown response with stale data when available

### Requirement: Existing market quote endpoint remains compatible
The existing direct market quote endpoint SHALL remain compatible while investment portfolio refresh uses the backend-owned investment refresh orchestration endpoint.

#### Scenario: Direct quote consumer calls market quote endpoint
- **WHEN** a caller requests `GET /api/market/quote` with valid query parameters
- **THEN** the backend SHALL preserve the existing canonical quote success/error behavior for direct quote use cases

#### Scenario: Investment refresh needs provider data
- **WHEN** investment refresh needs a provider quote
- **THEN** backend services SHALL use provider/service dependencies in-process rather than requiring the frontend to call the direct market quote endpoint first
