## ADDED Requirements

### Requirement: Repositories scope user-owned queries by authenticated user
Backend repositories SHALL include authenticated ownership scope in every query that accesses user-private persisted rows.

#### Scenario: User-owned rows are queried
- **WHEN** a repository lists, reads, aggregates, updates, or deletes private financial rows
- **THEN** the query MUST include the authenticated user's ownership scope

#### Scenario: Foreign private row ID is provided
- **WHEN** an authenticated user provides an ID belonging to another user
- **THEN** the backend MUST not return or mutate that row

### Requirement: Related-row writes validate ownership transactionally
The backend SHALL validate ownership of all related private rows before committing writes that link multiple entities.

#### Scenario: Transaction references an account and category
- **WHEN** a transaction write references an account, category, subcategory, goal, installment plan, or investment entry
- **THEN** the backend MUST verify all referenced private rows belong to the authenticated user before committing

#### Scenario: Multi-entity write crosses users
- **WHEN** a write attempts to link rows owned by different users
- **THEN** the backend MUST reject the operation and MUST NOT commit partial changes

### Requirement: Authorization errors avoid data leakage by default
The API SHALL use safe error behavior for missing or foreign private resources.

#### Scenario: Unauthenticated request targets private data
- **WHEN** no valid authenticated session exists
- **THEN** the API MUST return `401` or the selected unauthenticated error contract

#### Scenario: Authenticated user targets another user's row
- **WHEN** an authenticated user requests, updates, or deletes another user's private row
- **THEN** the API SHOULD return `404` by default to avoid confirming resource existence unless product requirements choose `403` for that endpoint

### Requirement: Client-provided ownership is never trusted
The backend SHALL derive ownership from authenticated session context rather than trusting `userId` values from request bodies, query parameters, or client state.

#### Scenario: Client sends userId in a mutation body
- **WHEN** a private mutation request includes a `userId` field
- **THEN** the backend MUST ignore, reject, or validate it against the authenticated session and MUST NOT use it as the source of ownership truth
