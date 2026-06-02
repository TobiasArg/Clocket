## ADDED Requirements

### Requirement: User ownership columns are added to private tables
The Prisma/PostgreSQL schema SHALL add required ownership relations to all user-private persisted tables before multi-user production use.

#### Scenario: Prisma schema is updated for auth
- **WHEN** auth ownership is implemented
- **THEN** private finance tables MUST include a required `userId` relation or an explicitly equivalent ownership key

#### Scenario: Existing private table remains unowned
- **WHEN** a persisted table contains user-private financial data and lacks ownership
- **THEN** the implementation MUST either add ownership before exposing it to authenticated users or explicitly block multi-user access to that table

### Requirement: Unique constraints become ownership-safe
The schema SHALL update unique constraints and indexes that currently assume a single profile so that users can create equivalent names/assets/settings without conflicts across users.

#### Scenario: Subcategory uniqueness is enforced
- **WHEN** two users create a subcategory with the same name under their own categories
- **THEN** the database MUST allow both rows while still preventing duplicate names within the same user's category scope

#### Scenario: Investment position uniqueness is enforced
- **WHEN** two users hold the same investment asset
- **THEN** the database MUST allow one position per user and asset rather than enforcing a single global position for that asset

#### Scenario: Settings uniqueness is enforced
- **WHEN** settings are persisted after auth is introduced
- **THEN** the database MUST enforce at most one active settings row per user or an equivalent deterministic user-scoped settings policy

### Requirement: Ownership backfill is explicit
The ownership migration SHALL define how existing unowned rows are assigned, discarded, or blocked before applying required ownership constraints.

#### Scenario: Existing rows are present during migration
- **WHEN** unowned private rows exist before adding required `userId` constraints
- **THEN** the migration plan MUST define a deterministic owner assignment, data reset, or blocking condition before constraints are made required

#### Scenario: Production data exists
- **WHEN** production contains real unowned private rows
- **THEN** the implementation MUST NOT silently attach all rows to an arbitrary user without documented product approval

### Requirement: Migration rollback is documented
The auth ownership implementation SHALL include rollback notes for schema and data migrations.

#### Scenario: Ownership migration is proposed
- **WHEN** a future implementation change adds ownership migrations
- **THEN** it MUST include backup, rollback, and non-production reset guidance appropriate to the migration risk
