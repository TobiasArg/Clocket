# backend-owned-installment-ledger-effects Specification

## Purpose
TBD - created by archiving change backend-owned-installment-ledger-effects. Update Purpose after archive.
## Requirements
### Requirement: Installment ledger effects are backend-owned
The backend SHALL own canonical installment paid-count transitions and generated transaction ledger effects for installment plans.

#### Scenario: Due installment is marked paid
- **WHEN** a mark-paid request targets an active installment plan whose next installment due date is not in the future
- **THEN** the backend SHALL increment the canonical paid installment count by one
- **AND** SHALL create or reconcile the generated transaction for that installment atomically

#### Scenario: Future installment is blocked
- **WHEN** a mark-paid request targets an installment whose next due date is in the future
- **THEN** the backend SHALL NOT update the paid installment count
- **AND** SHALL NOT create a generated transaction
- **AND** SHALL return a controlled future-date blocked response

#### Scenario: Elapsed installments are reconciled
- **WHEN** a reconcile-due request runs for plans with elapsed unpaid installments
- **THEN** the backend SHALL update paid counts up to the elapsed due count
- **AND** SHALL create missing generated transactions for due installments without duplicating existing ones

### Requirement: Generated installment transactions are idempotent
Generated installment transaction effects SHALL be idempotent across repeated requests, reloads, retries, and reconcile runs.

#### Scenario: Mark-paid request is retried
- **WHEN** the same installment effect is processed more than once for the same plan and installment index
- **THEN** the backend SHALL create at most one generated transaction for that installment
- **AND** SHALL return canonical plan and ledger effect state

#### Scenario: Plan deletion reconciles generated effects
- **WHEN** an installment plan is deleted or cleared through backend APIs
- **THEN** the backend SHALL apply the existing deletion policy consistently to related generated transaction effects
- **AND** SHALL avoid orphaned active generated ledger rows

### Requirement: Frontend plans flow delegates canonical effects to backend
The frontend plans page SHALL delegate canonical paid-count and generated transaction effects to backend installment action endpoints.

#### Scenario: User marks an installment as paid
- **WHEN** the user clicks the paid action on a plan
- **THEN** the frontend SHALL call the backend mark-paid operation
- **AND** SHALL map the backend response to existing loading, success, blocked, and error UI behavior

#### Scenario: Plans page loads elapsed installments
- **WHEN** the plans page loads plans that may need elapsed-installment reconciliation
- **THEN** the frontend SHALL NOT perform local canonical paid-count auto-sync
- **AND** SHALL rely on backend-canonical plan data or an explicit backend reconcile operation

### Requirement: Auth and ownership remain out of scope
The installment ledger effects change SHALL NOT introduce authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Ledger effects need future user scoping
- **WHEN** a design or implementation concern would require user identity or ownership to solve fully
- **THEN** the concern SHALL be documented as future work
- **AND** SHALL NOT be implemented in this change

