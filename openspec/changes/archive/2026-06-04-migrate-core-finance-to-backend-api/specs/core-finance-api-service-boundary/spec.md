## ADDED Requirements

### Requirement: Core finance APIs expose backend-owned accounts
The backend SHALL expose account API routes that provide list, get, create, update, and soft-delete behavior through service/repository modules.

#### Scenario: Accounts are listed
- **WHEN** the frontend requests accounts
- **THEN** the backend MUST return active accounts from backend persistence with `id`, `name`, `balance`, `currency`, `icon`, `createdAt`, and `updatedAt`

#### Scenario: Account is created
- **WHEN** a valid account create request is submitted
- **THEN** the backend MUST create the account through the accounts service/repository and return the backend-generated ID

#### Scenario: Account is removed
- **WHEN** an account delete request targets an existing account
- **THEN** the backend MUST use soft delete or repository-defined protected delete behavior rather than deleting related transactions silently

### Requirement: Core finance APIs expose normalized categories and subcategories
The backend SHALL expose category API routes that provide list, get, create, update, replace-subcategories, and soft-delete behavior through service/repository modules.

#### Scenario: Categories are listed
- **WHEN** the frontend requests categories
- **THEN** the backend MUST return active categories with durable category IDs and nested subcategory records including durable subcategory IDs, names, and ordering metadata

#### Scenario: Subcategories are replaced
- **WHEN** a replace-subcategories request is submitted for an active category
- **THEN** the backend MUST update the category's subcategories transactionally or reject the request with a controlled error

#### Scenario: Category is missing or deleted
- **WHEN** a request targets a missing or soft-deleted category
- **THEN** the backend MUST return a controlled not-found response rather than leaking repository or Prisma errors

### Requirement: Core finance APIs expose canonical transactions
The backend SHALL expose transaction API routes that provide list, get, create, update, and soft-delete behavior through service/repository modules.

#### Scenario: Transactions are listed
- **WHEN** the frontend requests transactions with optional account, category, subcategory, goal, installment plan, or date filters
- **THEN** the backend MUST return active transactions ordered consistently by transaction date and creation time

#### Scenario: Transaction is created
- **WHEN** a valid transaction create request is submitted
- **THEN** the backend MUST validate active account, category/subcategory, goal, and installment-plan references before persisting the transaction

#### Scenario: Transaction references invalid data
- **WHEN** a transaction request references a missing account, category, subcategory, goal, or installment plan
- **THEN** the backend MUST return a controlled validation error with a stable error code

#### Scenario: Saving transaction is submitted without goal
- **WHEN** a transaction has type `saving` and no active goal reference
- **THEN** the backend MUST reject the request with a controlled validation error

### Requirement: API handlers remain thin adapters
Core finance API handlers SHALL parse HTTP requests, call services, and serialize responses without importing Prisma directly.

#### Scenario: Route handler needs persisted data
- **WHEN** an account, category, or transaction route reads or writes persisted data
- **THEN** it MUST call a backend service or repository module instead of importing the Prisma client directly in the route handler

#### Scenario: Service logic is tested
- **WHEN** backend core finance behavior is validated
- **THEN** tests MUST cover service/repository behavior separately from or in addition to HTTP route behavior

### Requirement: API contracts use runtime validation
Core finance API routes SHALL validate request bodies, path parameters, query parameters, and response-shaping assumptions at runtime.

#### Scenario: Invalid request body is submitted
- **WHEN** a create or update request contains invalid names, amounts, dates, IDs, or enum values
- **THEN** the backend MUST reject the request before repository mutation and return a controlled validation response

#### Scenario: Decimal amount crosses the API boundary
- **WHEN** account balances or transaction amounts are returned by the backend
- **THEN** they MUST be serialized as stable decimal strings or another explicitly documented lossless representation
