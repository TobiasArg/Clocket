## ADDED Requirements

### Requirement: Financial domain rows are user-owned
The persistence model SHALL assign private financial domain rows to an owning user before multi-user backend persistence is exposed.

#### Scenario: Account-like private row is persisted
- **WHEN** an account, category, subcategory, transaction, budget, budget scope, goal, installment plan, investment position, investment entry, or settings row is created
- **THEN** it MUST be associated with the authenticated owning user

#### Scenario: Private rows are listed
- **WHEN** a user lists any private financial domain data
- **THEN** the result set MUST include only rows owned by that user

### Requirement: Shared market reference data contains no private state
The persistence model SHALL keep market reference/cache rows shared only when those rows contain no user-specific holdings, preferences, notes, or provider state.

#### Scenario: Market quote snapshot is stored as shared data
- **WHEN** a market quote snapshot is saved without user-private metadata
- **THEN** it MAY remain unowned and reusable across users

#### Scenario: Market data stores user-specific information
- **WHEN** market-related data includes watchlists, refresh preferences, provider credentials, private notes, positions, or entries
- **THEN** that data MUST be user-owned or moved to a user-owned table

### Requirement: Settings become per-user
Application settings SHALL move from the current single-profile model to one settings record per user or an equivalent user-scoped settings model.

#### Scenario: User settings are requested
- **WHEN** an authenticated user requests settings
- **THEN** the backend MUST return that user's settings and MUST NOT return a global default row shared with other users

#### Scenario: User settings are initialized
- **WHEN** a user has no settings row yet
- **THEN** the backend MAY create a default settings row scoped to that user or return default values without persisting until first update

### Requirement: Shared-ledger behavior requires a separate change
The first ownership model SHALL treat financial data as personal user-owned data unless a superseding OpenSpec change defines shared ledgers, memberships, and roles.

#### Scenario: Collaboration is requested
- **WHEN** product requirements require household, team, or shared-ledger access
- **THEN** a separate OpenSpec change MUST define ledger ownership, membership roles, invitations, and authorization rules before implementation
