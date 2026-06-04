## ADDED Requirements

### Requirement: Backend foundation keeps Next.js API Routes thin
The backend SHALL keep Next.js API Routes as HTTP adapters while moving provider logic, validation logic, and reusable contracts into route-independent backend modules.

#### Scenario: Route delegates to backend module
- **WHEN** `GET /api/market/quote` receives a valid request
- **THEN** the route handler MUST parse HTTP input and delegate quote retrieval to a backend module instead of embedding provider parsing logic in the handler

#### Scenario: Framework escalation is deferred
- **WHEN** backend foundation work is implemented
- **THEN** the system MUST NOT introduce NestJS unless a later OpenSpec change explicitly justifies the migration

### Requirement: Backend configuration is explicit and validated
The backend SHALL read required provider configuration from environment variables and validate numeric configuration before using it.

#### Scenario: Missing provider API key
- **WHEN** `ALPHA_VANTAGE_API_KEY` is missing for a market quote request
- **THEN** the backend MUST return a controlled server error without calling Alpha Vantage

#### Scenario: Timeout env is provided
- **WHEN** `ALPHA_VANTAGE_TIMEOUT_MS` is set to a positive integer
- **THEN** the Alpha Vantage client MUST use that timeout value for provider requests

#### Scenario: Timeout env is invalid
- **WHEN** `ALPHA_VANTAGE_TIMEOUT_MS` is missing or invalid
- **THEN** the Alpha Vantage client MUST use the documented default timeout of 12000 milliseconds

### Requirement: Backend validation gates exist
The backend SHALL provide scripts for build, typecheck where TypeScript exists, and automated tests before larger domain migration begins.

#### Scenario: Backend validation is run locally
- **WHEN** a backend foundation change is completed
- **THEN** maintainers MUST be able to run backend build and test commands from `backend/package.json`

#### Scenario: Contract behavior changes
- **WHEN** market quote request or response behavior changes
- **THEN** automated tests MUST cover the changed behavior before the change is committed

### Requirement: Backend avoids auth and persistence implementation in foundation phase
The backend foundation SHALL document future auth and persistence decisions without implementing users, sessions, Prisma schema, PostgreSQL connection, or migrations in this change.

#### Scenario: Foundation phase is completed
- **WHEN** the first backend foundation implementation is committed
- **THEN** no auth tables, user model, session logic, Prisma schema, or PostgreSQL connection MUST be required to run the current backend
