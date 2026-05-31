## ADDED Requirements

### Requirement: LocalStorage migration uses dry-run before write
The migration path from frontend `localStorage` SHALL support a dry-run validation step before writing data to PostgreSQL.

#### Scenario: User imports localStorage payload
- **WHEN** a localStorage backup or browser payload is submitted for migration
- **THEN** the backend MUST validate shape, versions, entity counts, and cross-entity references before committing records

#### Scenario: Dry-run finds invalid references
- **WHEN** migration validation finds missing accounts, categories, goals, cuota plans, or investment positions
- **THEN** the backend MUST report actionable errors and MUST NOT write partial data

### Requirement: Legacy IDs are mapped during migration
The migration process SHALL preserve traceability from frontend IDs to backend IDs.

#### Scenario: Entity is imported
- **WHEN** a localStorage entity is written to PostgreSQL
- **THEN** the migration MUST record or preserve enough mapping to relate the legacy ID to the backend persisted ID

#### Scenario: Related entity is imported
- **WHEN** a transaction references a legacy account, category, goal, cuota plan, or investment entry
- **THEN** the migration MUST resolve that reference through the legacy ID map or reject the import

### Requirement: Migration order follows dependency order
The migration process SHALL import entities in an order that preserves referential integrity.

#### Scenario: Core data is imported
- **WHEN** migration imports accounts, categories, and transactions
- **THEN** accounts and categories/subcategories MUST be imported before transactions

#### Scenario: Domain data is imported
- **WHEN** migration imports budgets, goals, cuotas, investments, and snapshots
- **THEN** prerequisite categories, subcategories, accounts, and base assets MUST exist first

### Requirement: Frontend localStorage remains active until domain replacement
The migration plan SHALL not remove localStorage repositories until matching backend APIs and HTTP repositories are implemented and validated.

#### Scenario: Persistence schema is implemented
- **WHEN** Prisma/PostgreSQL schema exists but a domain API is not ready
- **THEN** the frontend MUST continue using the existing localStorage repository for that domain

#### Scenario: Domain API is validated
- **WHEN** a backend domain API and HTTP repository pass validation
- **THEN** the frontend may switch that domain away from localStorage through a separate implementation change

### Requirement: Migration is reversible before cutover
The migration path SHALL define rollback behavior before frontend writes exclusively to backend persistence.

#### Scenario: Migration fails before cutover
- **WHEN** data migration fails before frontend repository cutover
- **THEN** localStorage source data MUST remain untouched and usable by the frontend

#### Scenario: Cutover is completed
- **WHEN** a domain switches from localStorage to backend writes
- **THEN** rollback MUST be handled by that domain's implementation change with explicit data consistency notes
