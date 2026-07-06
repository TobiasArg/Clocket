# backend-data-integrity-boundaries Specification

## Purpose
TBD - created by archiving change harden-backend-data-integrity-boundaries. Update Purpose after archive.
## Requirements
### Requirement: Destructive operations preserve active data integrity
Backend destructive operations SHALL either resolve linked active records explicitly or reject the operation with a controlled error.

#### Scenario: Goal with active transactions is deleted
- **WHEN** a goal has active linked transactions and a delete request is made without an explicit resolution strategy
- **THEN** the backend SHALL reject the request with a controlled 4xx error
- **AND** linked active transactions SHALL NOT be left in an ambiguous goal state

#### Scenario: Account with active transactions is deleted
- **WHEN** an account has active linked transactions and a delete request is made
- **THEN** the backend SHALL either require an explicit resolution strategy or reject the request with a controlled 4xx error

### Requirement: Installment ledger effects are idempotent
Installment payment operations SHALL avoid duplicate ledger transactions when retried or invoked concurrently.

#### Scenario: Mark paid is retried
- **WHEN** the same installment payment action is submitted more than once for the same plan and installment index
- **THEN** the backend SHALL create at most one ledger transaction for that installment index
- **AND** the paid installment count SHALL remain consistent with the generated ledger effects

### Requirement: Read endpoints are side-effect free
GET endpoints SHALL NOT create or mutate financial records as a side effect of reading data.

#### Scenario: Investment refs are read for an unknown ticker
- **WHEN** a client reads investment reference data for an unknown asset or ticker
- **THEN** the backend SHALL return an empty/not-found/controlled response without creating asset or reference records

### Requirement: Predictable invalid input returns controlled errors
Backend APIs SHALL validate predictable invalid input before persistence and return structured 4xx errors.

#### Scenario: Invalid period month is requested
- **WHEN** a client sends an invalid `periodMonth` query value
- **THEN** the backend SHALL return a controlled 400 response
- **AND** the request SHALL NOT surface an uncontrolled Prisma or server error

#### Scenario: Invalid money amount is submitted
- **WHEN** a client submits a money amount outside the accepted positive/range/scale rules for the target domain
- **THEN** the backend SHALL reject the request with a controlled validation error before writing to the database

