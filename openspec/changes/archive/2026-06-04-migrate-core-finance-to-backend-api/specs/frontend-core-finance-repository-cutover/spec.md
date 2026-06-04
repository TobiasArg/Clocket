## ADDED Requirements

### Requirement: Frontend accounts repository uses backend API persistence
The frontend SHALL replace the active accounts repository binding with an HTTP-backed implementation that satisfies the accounts domain repository contract.

#### Scenario: Accounts page lists accounts
- **WHEN** a frontend consumer calls `AccountsRepository.list`
- **THEN** the active repository MUST fetch backend accounts and return frontend `AccountItem` records with numeric `balance` values and existing account display fields

#### Scenario: Account mutation succeeds
- **WHEN** a frontend consumer creates, updates, or removes an account
- **THEN** the active repository MUST call the backend API and return the backend-confirmed result rather than mutating localStorage

#### Scenario: Backend is unavailable
- **WHEN** the account API request fails due to network or server error
- **THEN** the repository MUST surface a controlled error state to the caller instead of silently falling back to localStorage

### Requirement: Frontend categories repository uses backend API persistence
The frontend SHALL replace the active categories repository binding with an HTTP-backed implementation that satisfies the categories domain repository contract.

#### Scenario: Categories page lists categories
- **WHEN** a frontend consumer calls `CategoriesRepository.list`
- **THEN** the active repository MUST fetch backend categories and map backend subcategory records to the existing frontend category shape, including `subcategoryCount` and subcategory names

#### Scenario: Category subcategories are updated
- **WHEN** a frontend consumer updates category subcategories
- **THEN** the active repository MUST call the backend category/subcategory API and return the backend-confirmed category shape

#### Scenario: Protected or missing category cannot be removed
- **WHEN** a category delete is rejected by backend policy or the category does not exist
- **THEN** the repository MUST return the existing domain-level failure shape or surface a controlled error consistent with existing callers

### Requirement: Frontend transactions repository uses backend API persistence
The frontend SHALL replace the active transactions repository binding with an HTTP-backed implementation that satisfies the transactions domain repository contract.

#### Scenario: Transactions are listed
- **WHEN** a frontend consumer calls `TransactionsRepository.list`
- **THEN** the active repository MUST fetch backend transactions and return transaction items compatible with current hooks and page models

#### Scenario: Transaction display fields are mapped
- **WHEN** backend canonical transaction records are converted for frontend use
- **THEN** the repository MUST map amount, amount color, date, metadata, category display name, icons, and subcategory name consistently with existing UI expectations

#### Scenario: Transaction mutation succeeds
- **WHEN** a frontend consumer creates, updates, or removes a transaction
- **THEN** the active repository MUST call the backend API, return the backend-confirmed result, and dispatch the existing transaction-changed notification if current consumers still depend on it

#### Scenario: Transaction mutation is rejected
- **WHEN** the backend rejects a transaction because of invalid references or validation errors
- **THEN** the repository MUST surface a controlled error rather than creating local fallback records

### Requirement: LocalStorage repositories are no longer active persistence for core finance
After cutover, localStorage account, category, and transaction repositories SHALL NOT be the active persistence source for production core finance flows.

#### Scenario: Active repository exports are imported
- **WHEN** hooks or page models import the active accounts, categories, or transactions repositories
- **THEN** they MUST receive HTTP-backed implementations rather than localStorage-backed implementations

#### Scenario: LocalStorage repository classes remain in code temporarily
- **WHEN** localStorage repository classes remain for tests, rollback, or reference during the implementation phase
- **THEN** they MUST NOT be wired as the active production persistence source for the cutover domains

### Requirement: Frontend repository interfaces remain stable where practical
The cutover SHALL preserve existing frontend repository method names and return shapes unless normalized backend data requires a narrowly scoped interface update.

#### Scenario: Hooks consume repositories
- **WHEN** existing hooks and page models call repository methods
- **THEN** the cutover SHOULD avoid broad hook rewrites by keeping repository interfaces compatible

#### Scenario: Interface change is required
- **WHEN** a backend-backed repository needs a new field such as durable `subcategoryId`
- **THEN** the implementation MUST update the minimal affected domain types and consumers in the same change
