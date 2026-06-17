## ADDED Requirements

### Requirement: Budget usage read models are backend-owned
The backend SHALL own canonical budget usage read models derived from backend-persisted budgets and transactions.

#### Scenario: Monthly budget usage is requested
- **WHEN** the frontend requests budget usage for a valid `periodMonth`
- **THEN** the backend SHALL return per-budget spent amount, limit amount, raw progress, clamped progress, remaining amount, and overspent amount
- **AND** SHALL compute those values from backend-owned transactions

#### Scenario: Expenses are matched to budget scope
- **WHEN** transactions exist in the requested month
- **THEN** the backend SHALL include only expense transactions that match each budget's normalized scope rules
- **AND** SHALL exclude income, invalid-date transactions, and transactions outside the requested month

#### Scenario: No matching transactions exist
- **WHEN** a budget has no matching expense transactions for the requested month
- **THEN** the backend SHALL return zero spent usage without treating the budget as missing

### Requirement: Budget scope matching is centralized in backend
The backend SHALL centralize budget scope normalization and transaction matching for usage read models.

#### Scenario: Budget targets all subcategories
- **WHEN** a budget scope rule targets all subcategories for a category
- **THEN** transactions in that category SHALL contribute to budget usage regardless of subcategory

#### Scenario: Budget targets selected subcategories
- **WHEN** a budget scope rule targets selected subcategories
- **THEN** only transactions whose normalized subcategory matches the selected scope SHALL contribute to usage

#### Scenario: Budget scope uses no-subcategory token
- **WHEN** a budget scope includes the no-subcategory token
- **THEN** transactions without a subcategory SHALL be matched consistently with existing frontend behavior

### Requirement: Budget detail usage is backend-owned
The backend SHALL provide budget detail usage grouping for a budget and month.

#### Scenario: Budget detail usage is requested
- **WHEN** the frontend requests usage detail for an existing budget
- **THEN** the backend SHALL return grouped expense usage by category/subcategory label with amount and percentage basis
- **AND** SHALL use the same month and scope rules as the budget list usage model

#### Scenario: Budget detail target is missing
- **WHEN** the frontend requests usage detail for a missing budget id
- **THEN** the backend SHALL return a controlled not-found response

### Requirement: Frontend budget pages consume backend usage
The frontend SHALL consume backend budget usage read models for canonical spending, progress, overspent, and detail values.

#### Scenario: Budgets page renders monthly summaries
- **WHEN** the budgets page renders a selected month
- **THEN** the frontend SHALL request backend usage for that month
- **AND** SHALL map backend usage values to existing cards, progress bars, and summary totals

#### Scenario: Budget detail page renders spending breakdown
- **WHEN** the budget detail page renders a budget
- **THEN** the frontend SHALL use backend detail usage for spending totals and subcategory rows
- **AND** SHALL preserve existing formatting and empty-state behavior

### Requirement: Auth and ownership remain out of scope
The budget usage read-model change SHALL NOT introduce authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Usage scoping appears to require user ownership
- **WHEN** a design or implementation concern would require user identity or ownership to solve fully
- **THEN** the concern SHALL be documented as future work
- **AND** SHALL NOT be implemented in this change
