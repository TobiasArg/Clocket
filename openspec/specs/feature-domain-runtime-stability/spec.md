# feature-domain-runtime-stability Specification

## Purpose
Require migrated feature-domain APIs to remain stable, validated, backend-persistent, and frontend-compatible after the backend repository cutover.

## Requirements
### Requirement: Migrated feature-domain APIs remain runtime-stable
The backend SHALL preserve stable runtime behavior for migrated budgets, goals, installments/cuotas, investments, market snapshots/refs, and app settings APIs using backend persistence as the canonical source of truth.

#### Scenario: Migrated feature record persists after refresh
- **WHEN** a migrated feature-domain record is created or updated through the backend API
- **THEN** a subsequent read after browser refresh or API re-fetch SHALL return the backend-canonical record without depending on browser localStorage

#### Scenario: Migrated feature record is removed
- **WHEN** a migrated feature-domain record is deleted or cleared through its backend API
- **THEN** subsequent reads SHALL not return the removed active record and SHALL return the existing empty-state-compatible response shape

### Requirement: Runtime validation remains controlled
Migrated feature-domain APIs SHALL return controlled validation errors for invalid runtime payloads and SHALL NOT persist partial invalid changes.

#### Scenario: Invalid feature-domain payload is submitted
- **WHEN** a request contains invalid money, date/month, enum, reference, ticker, entry type, count, profile, or security field values
- **THEN** the backend SHALL return a controlled 4xx response and SHALL NOT persist invalid partial state

#### Scenario: Missing feature-domain reference is submitted
- **WHEN** a request references a missing category, subcategory, account, transaction, investment position, asset, or settings field dependency
- **THEN** the backend SHALL return a controlled not-found or validation response without crashing

### Requirement: Migrated API response shapes remain frontend-compatible
Migrated feature-domain APIs SHALL return payloads that frontend HTTP repositories can map deterministically to existing domain/UI shapes.

#### Scenario: Backend payload contains persistence-specific values
- **WHEN** the backend returns decimals, nullable references, timestamps, backend-generated IDs, or normalized references
- **THEN** the response SHALL include enough information for the frontend HTTP repository to expose the existing domain-level shape without localStorage ID remapping
