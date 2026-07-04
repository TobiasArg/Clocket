# market-refresh-validation Specification

## Purpose
Capture automated and manual validation expectations for backend-owned investment market refresh, including provider success/failure handling, frontend mapping, and explicit evidence before archival.

## Requirements
### Requirement: Backend market refresh behavior is tested
The implementation SHALL include backend tests for investment refresh orchestration, provider success/failure handling, snapshot/ref persistence, request validation, and asset de-duplication.

#### Scenario: Backend refresh tests run
- **WHEN** the backend test suite is executed
- **THEN** tests SHALL cover fresh-snapshot skip, forced refresh, provider success, provider throttling, invalid symbol, transient failure, cooldown, invalid payload, missing position, and unsupported method behavior

#### Scenario: Provider refresh succeeds
- **WHEN** a backend test provider returns a valid quote
- **THEN** tests SHALL assert that the backend persists a snapshot, updates refs, and returns frontend-mappable refresh state

### Requirement: Frontend investment refresh mapping is tested
The implementation SHALL include frontend tests for backend refresh endpoint mapping and the affected investment refresh domain flow.

#### Scenario: Frontend refresh tests run
- **WHEN** the frontend test suite is executed
- **THEN** tests SHALL cover backend refresh invocation, mapped portfolio display values, forced refresh, stale fallback, cooldown, and controlled error behavior

### Requirement: Validation evidence remains explicit
The change SHALL document automated and manual validation evidence before archival.

#### Scenario: Implementation is ready for review
- **WHEN** backend and frontend implementation tasks are complete
- **THEN** maintainers SHALL run backend tests/build, frontend tests/build, and strict OpenSpec validation
- **AND** SHALL document manual QA for automatic refresh, forced refresh, provider failure fallback, and persisted snapshot/ref state

### Requirement: Auth remains out of scope
The investment refresh orchestration change SHALL NOT introduce authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Refresh scope appears to require user ownership
- **WHEN** a design or implementation concern would require user identity or ownership to solve fully
- **THEN** the concern SHALL be documented as future work for the auth/ownership change and SHALL NOT be implemented in this change
