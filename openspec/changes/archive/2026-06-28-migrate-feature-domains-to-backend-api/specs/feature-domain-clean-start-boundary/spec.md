## ADDED Requirements

### Requirement: Feature-domain localStorage clean-start
The migration SHALL treat existing browser localStorage records for migrated feature domains as non-canonical and SHALL NOT require importing, mapping, or preserving them during cutover.

#### Scenario: Feature-domain cutover runs with existing localStorage records
- **WHEN** the application starts after a feature domain has been migrated and old localStorage records exist for that domain
- **THEN** the application SHALL ignore or clear those records and SHALL use backend data as canonical

#### Scenario: Browser storage contains legacy IDs
- **WHEN** legacy localStorage records contain IDs that do not exist in backend persistence
- **THEN** the migrated frontend SHALL NOT send those IDs as canonical references unless explicitly created by backend APIs

### Requirement: Backend-generated IDs are canonical
Feature-domain records SHALL use backend-generated IDs as canonical identifiers after cutover.

#### Scenario: New feature-domain record is created
- **WHEN** the frontend creates a budget, goal, cuota, investment position, investment entry, snapshot, asset ref, or settings record through the backend API
- **THEN** the frontend SHALL store and use the backend-returned identifier and SHALL NOT synthesize a localStorage-style identifier

### Requirement: Rollback restores localStorage bindings, not data merge
Rollback for feature-domain cutover SHALL be performed by reverting repository bindings or related code changes, not by merging backend data into localStorage.

#### Scenario: Feature-domain cutover is reverted
- **WHEN** a rollback is required after frontend bindings have moved to HTTP repositories
- **THEN** maintainers SHALL restore localStorage-backed bindings from version control and SHALL NOT rely on an automated backend-to-localStorage data migration

### Requirement: Clean-start scope is explicit
The migration SHALL document the affected feature-domain localStorage keys or repositories for budgets, goals, cuotas, investments, and settings before replacing active bindings.

#### Scenario: Domain binding is changed
- **WHEN** an implementation task switches a feature-domain binding from localStorage to HTTP
- **THEN** the task SHALL identify the legacy localStorage repository/key scope affected by that switch
