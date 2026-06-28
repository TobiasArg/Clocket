## ADDED Requirements

### Requirement: Transaction classification is backend-owned
The backend SHALL own transaction classification rules for income, expense, saving, category eligibility, amount sign consistency, and transaction presentation metadata.

#### Scenario: Income transaction is created
- **WHEN** the frontend creates a transaction with a positive amount sign
- **THEN** the backend SHALL validate that the selected category is eligible for income classification
- **AND** SHALL persist the transaction with canonical income classification and presentation metadata

#### Scenario: Expense transaction is created
- **WHEN** the frontend creates a transaction with a negative amount sign
- **THEN** the backend SHALL validate the account/category/subcategory references
- **AND** SHALL persist canonical expense classification and derived category presentation metadata

#### Scenario: Saving transaction is linked to goal
- **WHEN** a transaction is created or updated as goal-linked saving behavior
- **THEN** the backend SHALL validate the goal/category relationship required by the goal domain
- **AND** SHALL persist canonical saving classification without relying on frontend label heuristics

### Requirement: Frontend no longer infers income categories by name or id
The frontend SHALL NOT use category name/id string heuristics as the canonical source for income category eligibility.

#### Scenario: Transaction editor opens for income
- **WHEN** the user selects income mode in the transaction editor
- **THEN** the frontend SHALL use backend-provided category eligibility or backend validation responses
- **AND** SHALL NOT rely on category names containing `ingreso` or IDs containing `income` as canonical logic

#### Scenario: Category name changes
- **WHEN** an income-eligible category has a display name that does not contain an income keyword
- **THEN** transaction classification SHALL remain correct because eligibility is backend-owned

### Requirement: Transaction category and subcategory references are backend-validated
The backend SHALL validate account, category, and subcategory references for transaction create/update operations.

#### Scenario: Missing category is submitted
- **WHEN** a transaction create/update request references a missing category
- **THEN** the backend SHALL reject the request with a controlled validation or not-found response
- **AND** SHALL NOT persist the transaction mutation

#### Scenario: Missing subcategory is submitted
- **WHEN** a transaction create/update request references a subcategory that does not belong to the selected category
- **THEN** the backend SHALL reject the request with a controlled validation response
- **AND** SHALL NOT silently persist an inconsistent category/subcategory pair

### Requirement: Category and subcategory constraints are backend-owned
The backend SHALL own category and subcategory integrity constraints, including duplicate prevention and in-use deletion behavior.

#### Scenario: Duplicate category is created
- **WHEN** a category create request uses a normalized name that already exists
- **THEN** the backend SHALL reject the request with a controlled duplicate-category response
- **AND** SHALL preserve the existing category record unchanged

#### Scenario: Category in use is deleted
- **WHEN** a delete request targets a category referenced by existing transactions
- **THEN** the backend SHALL reject deletion with a controlled in-use response unless an explicit backend-supported resolution mode is provided
- **AND** SHALL NOT leave transactions with broken category references

### Requirement: Frontend category and transaction flows preserve UI behavior
The frontend SHALL preserve existing transaction and category UI behavior while delegating canonical constraints to backend.

#### Scenario: Backend rejects a category constraint
- **WHEN** the backend rejects duplicate or in-use category/subcategory changes
- **THEN** the frontend SHALL keep the form stable
- **AND** SHALL display controlled validation/status messaging

### Requirement: Auth remains out of scope
The transaction classification and category constraints change SHALL NOT introduce authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Category namespace appears to require user ownership
- **WHEN** duplicate or constraint semantics would differ under future per-user category ownership
- **THEN** the concern SHALL be documented as future work
- **AND** SHALL NOT be implemented in this change
