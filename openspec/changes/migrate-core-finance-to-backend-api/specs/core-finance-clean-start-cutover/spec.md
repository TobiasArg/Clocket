## ADDED Requirements

### Requirement: Core finance cutover uses clean-start semantics
The account, category, and transaction cutover SHALL NOT require importing existing browser localStorage records.

#### Scenario: Backend-backed repositories become active
- **WHEN** accounts, categories, and transactions switch to backend API persistence
- **THEN** existing `clocket.accounts`, `clocket.categories`, and `clocket.transactions` records MAY be deleted or ignored without an import step

#### Scenario: Legacy localStorage IDs exist
- **WHEN** existing localStorage records contain account, category, or transaction IDs
- **THEN** those IDs MUST NOT be required by the backend and MUST NOT require legacy ID mapping tables

### Requirement: Backend-generated IDs are canonical after cutover
After cutover, account, category, subcategory, and transaction IDs SHALL be generated and owned by the backend.

#### Scenario: New core finance record is created
- **WHEN** the frontend creates an account, category, subcategory, or transaction through the backend API
- **THEN** the returned backend ID MUST become the canonical ID used by the frontend

#### Scenario: Frontend sends a create request
- **WHEN** the frontend creates a core finance record
- **THEN** it MUST NOT send a required localStorage-generated ID as the canonical persisted ID

### Requirement: LocalStorage cleanup is explicit
The implementation SHALL explicitly document and perform the selected cleanup behavior for core localStorage keys.

#### Scenario: Cutover initialization runs
- **WHEN** backend-backed core finance repositories are active in the frontend
- **THEN** the implementation MUST either call the clean-start reset utility for core keys or document why keys are intentionally retained but ignored

#### Scenario: Storage is unavailable
- **WHEN** localStorage is unavailable during cleanup
- **THEN** the cleanup flow MUST skip safely without blocking backend-backed repository usage

### Requirement: Cutover rollback limitations are documented
The implementation SHALL document rollback behavior and data-loss trade-offs caused by clean-start cleanup.

#### Scenario: Cutover is rolled back after local keys are removed
- **WHEN** the frontend repository binding is rolled back to localStorage after cleanup ran
- **THEN** the rollback MUST NOT claim that previous browser-only account, category, or transaction records can be restored automatically

#### Scenario: Backend API exists but frontend cutover is reverted
- **WHEN** backend API routes remain deployed but frontend bindings return to localStorage
- **THEN** existing frontend localStorage behavior SHOULD remain functional for newly-created local records

### Requirement: Deferred domains remain outside clean-start cutover
The core finance cutover SHALL not reset unrelated localStorage domains as part of this change.

#### Scenario: Cutover cleanup runs
- **WHEN** core finance localStorage keys are deleted or ignored
- **THEN** budgets, goals, cuotas, investments, settings, and other non-core localStorage keys MUST NOT be cleared by this change unless a separate requirement explicitly adds them

#### Scenario: Transaction references deferred domains
- **WHEN** transactions include optional goal or installment-plan references
- **THEN** the cutover MUST preserve compatible reference fields without requiring those domain repositories to migrate in the same change
