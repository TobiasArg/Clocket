## ADDED Requirements

### Requirement: Persistence uses Prisma ORM with PostgreSQL
The backend persistence layer SHALL use Prisma ORM against PostgreSQL for backend-owned financial data.

#### Scenario: Persistence implementation begins
- **WHEN** a later implementation change adds database persistence
- **THEN** it MUST add Prisma ORM and PostgreSQL configuration unless a superseding OpenSpec change explicitly replaces this decision

#### Scenario: API handler accesses persisted data
- **WHEN** a Next.js API Route needs persisted data
- **THEN** it MUST call a service or repository module instead of importing the Prisma client directly in the route handler

### Requirement: Database environment is explicit
The backend SHALL define database environment variables and fail fast when required database config is missing during DB-backed operations.

#### Scenario: DB-backed runtime starts
- **WHEN** a DB-backed backend operation is executed without `DATABASE_URL`
- **THEN** the backend MUST fail with a controlled configuration error before executing a Prisma query

#### Scenario: Local development database is needed
- **WHEN** Prisma/PostgreSQL implementation begins
- **THEN** the change MUST document how to run a local PostgreSQL database for development and tests

### Requirement: Financial decimals are stored as decimals
The database SHALL store money, prices, quantities, and rates using Decimal/numeric columns instead of formatted strings or floating point columns.

#### Scenario: Transaction amount is persisted
- **WHEN** a transaction is written to the database
- **THEN** the amount MUST be stored as a Decimal/numeric value with an explicit currency

#### Scenario: Investment quantity is persisted
- **WHEN** an investment entry or position stores asset units or prices
- **THEN** those values MUST use Decimal/numeric precision appropriate for fractional assets

### Requirement: Timestamps and soft delete are standardized
The persistence schema SHALL use UTC timestamps and consistent `createdAt`, `updatedAt`, and optional `deletedAt` fields.

#### Scenario: Mutable entity is created
- **WHEN** an account, category, transaction, budget, goal, installment plan, investment position, or settings row is created
- **THEN** `createdAt` and `updatedAt` MUST be populated in UTC

#### Scenario: Financial entity should no longer appear in active lists
- **WHEN** a persisted financial entity cannot be safely hard-deleted due to references
- **THEN** the schema MUST support `deletedAt` or an explicit restricted delete policy

### Requirement: Multi-entity financial writes are transactional
The backend SHALL use database transactions for operations that create, update, or delete multiple related financial records.

#### Scenario: Installment plan sync creates transactions
- **WHEN** an installment plan operation creates or updates generated transactions
- **THEN** the plan and all generated transaction changes MUST be committed or rolled back atomically

#### Scenario: Goal creation synchronizes category data
- **WHEN** a goal operation creates or updates category/subcategory relationships
- **THEN** all related changes MUST occur in a single database transaction

### Requirement: Auth remains absent from persistence schema phase
The persistence schema design SHALL NOT require user, session, authentication, or authorization tables.

#### Scenario: Initial Prisma schema is implemented
- **WHEN** the first Prisma schema implementation is created from this spec
- **THEN** it MUST NOT require auth tables or session state to run backend persistence tests

#### Scenario: Auth is introduced later
- **WHEN** a later change introduces authentication
- **THEN** that change MUST define ownership/scoping columns and update unique constraints for user-owned data
