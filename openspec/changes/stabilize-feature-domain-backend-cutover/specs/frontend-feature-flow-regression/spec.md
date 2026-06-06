## ADDED Requirements

### Requirement: Migrated frontend flows remain functional
The frontend SHALL keep existing user flows functional for migrated budgets, goals, cuotas/installments, investments, and app settings after the backend cutover.

#### Scenario: User performs migrated domain CRUD flow
- **WHEN** a user lists, creates, edits, deletes, or refreshes a migrated feature-domain item from the UI
- **THEN** the UI SHALL call the active HTTP-backed repository, reflect the resulting backend state, and remain usable without requiring page reload except where explicitly triggered by the user

#### Scenario: User refreshes the browser after a migrated change
- **WHEN** a user refreshes the browser after creating or updating migrated feature-domain data
- **THEN** the UI SHALL reload the data from backend APIs and render the persisted values

### Requirement: Migrated UI interaction regressions are corrected
The stabilization SHALL verify and fix regressions in buttons, forms, navigation, and state transitions for migrated flows.

#### Scenario: Migrated flow button is clicked
- **WHEN** a primary or secondary action button in a migrated flow is clicked
- **THEN** it SHALL trigger the intended action exactly once, preserve existing UX expectations, and SHALL NOT call a stale localStorage-only persistence path

#### Scenario: Migrated form has invalid or incomplete input
- **WHEN** a migrated form receives invalid or incomplete input
- **THEN** the UI SHALL preserve existing validation/error behavior and SHALL NOT silently create invalid backend records

### Requirement: Migrated frontend states remain resilient
The frontend SHALL preserve loading, empty, error, and null-reference resilience for migrated domains.

#### Scenario: Backend returns empty data
- **WHEN** a migrated domain list API returns no records
- **THEN** the frontend SHALL render the existing empty state for that domain without crashing

#### Scenario: Backend request fails
- **WHEN** a migrated backend request fails with validation, not-found, network, or server error
- **THEN** the frontend SHALL surface a calm actionable error state and SHALL NOT crash the page

#### Scenario: Backend returns nullable references
- **WHEN** a migrated backend payload includes null or missing optional references
- **THEN** frontend hooks/page models SHALL handle the value safely and preserve existing display behavior
