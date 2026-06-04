## ADDED Requirements

### Requirement: Backend cutover starts from empty persisted state
The transition from frontend `localStorage` to backend persistence SHALL use a clean-start model with no required import of existing browser data.

#### Scenario: Domain API is introduced
- **WHEN** a domain switches from localStorage to backend persistence
- **THEN** existing localStorage data for that domain MAY be ignored or deleted and the backend MUST start from its persisted database state

#### Scenario: Existing browser data is present
- **WHEN** existing localStorage records exist during backend cutover
- **THEN** the application MUST NOT require those records to be migrated before the backend domain can be used

### Requirement: Legacy ID mapping is not required
The persistence schema SHALL NOT require legacy localStorage ID mapping tables for current data.

#### Scenario: New backend record is created
- **WHEN** accounts, categories, transactions, or later domain records are created through backend APIs
- **THEN** backend-generated IDs MUST be canonical and MUST NOT depend on localStorage IDs

#### Scenario: Existing localStorage record is discarded
- **WHEN** a localStorage record is not migrated
- **THEN** no legacy ID map or import batch entry MUST be created

### Requirement: Frontend localStorage remains active until domain replacement
The cutover plan SHALL not remove localStorage repositories until matching backend APIs and HTTP repositories are implemented and validated.

#### Scenario: Persistence schema is implemented
- **WHEN** Prisma/PostgreSQL schema exists but a domain API is not ready
- **THEN** the frontend MUST continue using the existing localStorage repository for that domain

#### Scenario: Domain API is validated
- **WHEN** a backend domain API and HTTP repository pass validation
- **THEN** the frontend may switch that domain away from localStorage through a separate implementation change

### Requirement: Cutover reset is explicit and safe
The cutover path SHALL make local data reset behavior explicit so users understand that existing local-only data is not preserved.

#### Scenario: Domain cutover is released
- **WHEN** a domain changes from localStorage to backend persistence
- **THEN** the implementation change MUST document whether localStorage keys are cleared immediately, ignored, or retained as temporary fallback

#### Scenario: Rollback before cutover
- **WHEN** a backend domain is implemented but frontend still uses localStorage
- **THEN** rollback MUST leave existing frontend localStorage behavior unaffected
