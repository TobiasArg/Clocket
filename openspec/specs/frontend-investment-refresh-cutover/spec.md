# frontend-investment-refresh-cutover Specification

## Purpose
TBD - created by archiving change backend-owned-investment-market-refresh. Update Purpose after archive.
## Requirements
### Requirement: Frontend investment refresh delegates to backend
The frontend SHALL delegate investment quote refresh orchestration to the backend investment refresh endpoint and SHALL NOT call direct market quote provider endpoints from the investment portfolio refresh domain flow.

#### Scenario: Investments page refreshes positions
- **WHEN** the investments page refreshes visible or background positions
- **THEN** the frontend SHALL call the backend investment refresh endpoint
- **AND** SHALL map backend refresh results to the existing portfolio row display behavior

#### Scenario: Manual force refresh is triggered
- **WHEN** the user triggers a manual investment refresh
- **THEN** the frontend SHALL send `force: true` to the backend refresh endpoint
- **AND** SHALL surface backend stale/error messages without crashing the page

#### Scenario: Backend returns cooldown or stale fallback
- **WHEN** the backend refresh endpoint returns cooldown or stale fallback state
- **THEN** the frontend SHALL keep the last usable portfolio value visible when available
- **AND** SHALL display a calm actionable warning or error consistent with existing investment refresh UX

### Requirement: Frontend mapping preserves current investment view behavior
The frontend SHALL preserve existing investment portfolio display behavior during the refresh cutover by mapping backend snapshots, refs, timestamps, and decimal values at the data/domain boundary.

#### Scenario: Backend returns Decimal/string market values
- **WHEN** the backend refresh response includes serialized decimal or timestamp values
- **THEN** the frontend SHALL map them to the numeric and ISO timestamp shapes expected by current portfolio metric and historical-series helpers

#### Scenario: Backend returns no snapshot for an asset
- **WHEN** the backend refresh response has no snapshot for a requested asset
- **THEN** the frontend SHALL preserve the existing fallback behavior using position buy price or empty historical data without crashing

### Requirement: Frontend does not reintroduce local refresh orchestration
The frontend SHALL NOT retain provider-sensitive investment refresh orchestration once backend-owned refresh is active.

#### Scenario: Investment refresh code is reviewed after cutover
- **WHEN** maintainers inspect the active investment refresh flow after cutover
- **THEN** it SHALL NOT directly import or call `fetchStockQuote`, `fetchCryptoRate`, or direct market quote provider error handling from the investment refresh domain path

