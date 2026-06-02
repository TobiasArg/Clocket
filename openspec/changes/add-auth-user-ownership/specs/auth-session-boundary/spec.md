## ADDED Requirements

### Requirement: Private finance APIs require authenticated identity
The backend SHALL require an authenticated user identity before executing any API operation that reads or mutates user-private persisted financial data.

#### Scenario: Unauthenticated private request is received
- **WHEN** a request targets a private finance API without a valid authenticated session
- **THEN** the API MUST return a controlled unauthenticated response and MUST NOT call private domain services or repositories

#### Scenario: Authenticated private request is received
- **WHEN** a request targets a private finance API with a valid authenticated session
- **THEN** the API MUST pass a trusted normalized user context to the domain service

### Requirement: Auth provider details stay outside domain services
The backend SHALL isolate auth provider/session-library details in API/auth adapter code rather than coupling domain services to provider-specific request objects.

#### Scenario: Service is called for a private operation
- **WHEN** an API adapter calls a domain service for user-owned data
- **THEN** it MUST pass normalized identity data such as `userId` rather than a raw provider session object

#### Scenario: Auth provider changes later
- **WHEN** the auth provider/session implementation is replaced
- **THEN** domain services and repositories SHOULD remain unchanged except for normalized auth context typing if required

### Requirement: Session lifecycle is product-defined before implementation
The auth implementation SHALL not proceed until product requirements define session lifetime, logout, refresh/revocation, account recovery, and supported sign-in methods.

#### Scenario: Auth implementation is started
- **WHEN** application code implementation begins for authentication
- **THEN** the implementation change MUST document the selected sign-in methods, session lifetime, logout behavior, and recovery behavior
