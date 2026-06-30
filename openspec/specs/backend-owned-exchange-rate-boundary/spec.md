## Purpose

Define the backend-owned USD/ARS exchange-rate boundary and frontend consumption rules that prevent fixed frontend constants from acting as canonical financial conversion data.

## Requirements

### Requirement: Exchange rates are provided by a backend-owned boundary
The backend SHALL provide canonical exchange-rate data for supported currency conversion pairs used by financial UI flows.

#### Scenario: Supported USD to ARS rate is requested
- **WHEN** a caller requests the supported USD to ARS exchange rate
- **THEN** the backend SHALL return a positive numeric rate
- **AND** SHALL include base currency, quote currency, source, timestamp, and stale/default metadata

#### Scenario: Unsupported currency pair is requested
- **WHEN** a caller requests an unsupported exchange-rate pair
- **THEN** the backend SHALL reject the request with a controlled validation error
- **AND** SHALL NOT return a misleading default as a canonical rate

### Requirement: Exchange-rate failures are explicit and display-safe
The backend and frontend SHALL handle unavailable rate sources with explicit fallback state rather than silent canonical fixed-rate behavior.

#### Scenario: Backend rate source is unavailable
- **WHEN** the configured rate source cannot provide a valid rate
- **THEN** the backend SHALL return a controlled fallback or error response
- **AND** SHALL mark whether the returned value is stale, defaulted, or unavailable

#### Scenario: Frontend receives fallback rate state
- **WHEN** the frontend receives stale/default exchange-rate metadata
- **THEN** financial UI SHALL remain usable
- **AND** SHALL avoid presenting the fallback value as fresh canonical market data

### Requirement: Frontend financial conversion uses backend rate data
The frontend SHALL consume backend exchange-rate data for canonical USD/ARS financial conversion paths instead of relying on fixed frontend constants as the source of truth.

#### Scenario: A USD amount is converted for ARS display or transaction effects
- **WHEN** a migrated financial flow converts USD to ARS
- **THEN** the conversion SHALL use the latest backend-provided exchange-rate state available to that flow
- **AND** SHALL preserve existing formatting and validation behavior

#### Scenario: Fixed frontend rate helper remains temporarily
- **WHEN** a fixed frontend rate helper remains for fallback compatibility
- **THEN** it SHALL be treated as non-canonical fallback behavior
- **AND** tests SHALL prevent it from being the default authoritative rate source

### Requirement: Auth remains out of scope
The exchange-rate boundary SHALL NOT introduce authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Rate preferences appear to require ownership
- **WHEN** a design concern would require user-specific settings or ownership
- **THEN** the concern SHALL be documented as future work
- **AND** SHALL NOT be implemented in this change
