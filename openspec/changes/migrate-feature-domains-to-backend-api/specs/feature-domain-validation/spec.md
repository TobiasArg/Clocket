## ADDED Requirements

### Requirement: Backend validation coverage
The implementation SHALL include backend tests for feature-domain API handlers, services, repositories, validation errors, not-found behavior, and unsupported methods.

#### Scenario: Backend feature-domain tests run
- **WHEN** the backend test suite is executed
- **THEN** tests SHALL cover successful and failing API/service behavior for migrated feature domains

### Requirement: Frontend repository and hook coverage
The implementation SHALL include frontend tests for HTTP repositories and affected hooks/page models when persistence behavior changes.

#### Scenario: Frontend feature-domain tests run
- **WHEN** the frontend test suite is executed
- **THEN** tests SHALL cover HTTP payload mapping, loading states, empty states, and error behavior for migrated feature domains

### Requirement: Build and type validation
The implementation SHALL pass local backend and frontend build/type validation required by the repository for affected areas.

#### Scenario: Validation commands are executed
- **WHEN** the feature-domain migration implementation is ready for review
- **THEN** maintainers SHALL run backend tests/build and frontend tests/build, or document any unavailable command with the blocking reason

### Requirement: OpenSpec validation remains strict
The OpenSpec change SHALL remain valid under strict validation before implementation and before archival.

#### Scenario: OpenSpec validation is executed
- **WHEN** maintainers run strict validation for `migrate-feature-domains-to-backend-api`
- **THEN** OpenSpec SHALL report the change as valid

### Requirement: Manual validation covers migrated flows
The implementation SHALL include manual validation evidence for the migrated feature-domain user flows.

#### Scenario: Manual QA is performed
- **WHEN** maintainers manually test the migrated frontend
- **THEN** they SHALL verify create, edit, delete, list, empty-state, and refresh behavior for each migrated feature domain included in the implementation phase
