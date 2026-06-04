## ADDED Requirements

### Requirement: Feature-domain HTTP repositories
The frontend SHALL provide HTTP-backed repositories that satisfy the existing domain repository interfaces for budgets, goals, cuotas/installments, investments, and app settings where practical.

#### Scenario: Hook consumes migrated repository
- **WHEN** a feature hook or page model calls an existing repository method after cutover
- **THEN** the active repository binding SHALL call the backend API and return the same domain-level shape expected by the hook or page model

#### Scenario: HTTP payload differs from UI domain shape
- **WHEN** the backend returns canonical persistence fields, decimals, timestamps, or normalized references that differ from frontend display models
- **THEN** the HTTP repository SHALL map the payload at the data boundary before exposing it to hooks or page models

### Requirement: Active bindings prefer backend repositories
The frontend SHALL switch active feature-domain data bindings from localStorage repositories to HTTP repositories for migrated domains.

#### Scenario: Budget list is loaded after cutover
- **WHEN** the budgets page model loads budget plans after the budgets domain is migrated
- **THEN** it SHALL read through the HTTP-backed budgets repository instead of the localStorage budgets repository

#### Scenario: Settings are loaded after cutover
- **WHEN** app settings are read after the settings domain is migrated
- **THEN** they SHALL be read through the HTTP-backed app settings repository instead of the localStorage settings repository

### Requirement: Frontend error handling compatibility
The frontend SHALL preserve existing async loading and error-handling behavior while replacing persistence implementations.

#### Scenario: Backend request fails
- **WHEN** a migrated feature-domain API request fails with a validation, not-found, network, or server error
- **THEN** the HTTP repository SHALL reject with an error that existing hooks or page models can surface without crashing the application

#### Scenario: Empty backend data is returned
- **WHEN** a migrated feature-domain list endpoint returns no records
- **THEN** the frontend SHALL render the existing empty-state behavior for that domain

### Requirement: Core finance references remain compatible
The frontend SHALL keep feature-domain references to accounts, categories, subcategories, and transactions compatible with the backend-backed core finance domains.

#### Scenario: Goal or budget references a category
- **WHEN** a goal or budget payload includes a category ID from backend core finance data
- **THEN** the frontend SHALL preserve that ID and SHALL NOT remap it to a legacy localStorage ID

#### Scenario: Cuota workflow creates or links transaction data
- **WHEN** a cuota workflow depends on transaction compatibility
- **THEN** the frontend SHALL use backend-canonical transaction/category references and SHALL NOT create divergent local-only references
