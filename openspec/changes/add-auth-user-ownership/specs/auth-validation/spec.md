## ADDED Requirements

### Requirement: Cross-user isolation is tested
The backend test suite SHALL prove that authenticated users cannot access or mutate each other's private financial data.

#### Scenario: User A lists private data
- **WHEN** test data exists for user A and user B
- **THEN** list and aggregate endpoints/repositories for user A MUST exclude user B's rows

#### Scenario: User A mutates user B data
- **WHEN** user A attempts to update or delete user B's private row
- **THEN** the operation MUST be rejected and user B's row MUST remain unchanged

### Requirement: Auth route behavior is tested
Private API routes SHALL have tests for unauthenticated requests, authenticated success, and authenticated foreign-resource access.

#### Scenario: Route receives no session
- **WHEN** a private route is called without authentication
- **THEN** the route test MUST assert the selected unauthenticated error response and that no private repository write occurs

#### Scenario: Route receives foreign resource ID
- **WHEN** a private route is called with a valid session and another user's resource ID
- **THEN** the route test MUST assert the selected safe error response

### Requirement: Ownership migration is validated
The implementation SHALL validate ownership migrations with schema generation, migration review, and tests or fixtures covering backfill behavior.

#### Scenario: Ownership schema changes are added
- **WHEN** Prisma models are updated for auth ownership
- **THEN** Prisma generation and backend tests MUST pass before the change is complete

#### Scenario: Existing unowned fixture rows are migrated
- **WHEN** migration tests or local reset scripts run against unowned fixture data
- **THEN** the result MUST match the documented backfill/reset policy

### Requirement: Frontend private state is cleared on logout
Frontend auth implementation SHALL validate that logout removes or invalidates private in-memory/client-side state.

#### Scenario: User logs out
- **WHEN** logout completes
- **THEN** private financial data held in frontend runtime state MUST be cleared or made inaccessible before another user can authenticate in the same browser session
