## ADDED Requirements

### Requirement: Account balances include opening balance
Displayed account balances SHALL include the account opening balance plus the net effect of eligible non-saving transactions assigned to that account.

#### Scenario: Account has opening balance and no transactions
- **WHEN** an account is created with an opening balance of 1000 and has no transactions
- **THEN** Accounts, Home account slides, and backend home analytics SHALL display that account balance as 1000 in the selected currency basis

#### Scenario: Account has opening balance and one expense
- **WHEN** an account has an opening balance of 1000 and a regular expense of 100 in the same currency basis
- **THEN** the displayed account balance SHALL be 900
- **AND** the total balance SHALL include 900 for that account

### Requirement: Money aggregates use one currency basis
Financial aggregates SHALL NOT sum raw values from different currencies without converting them to the requested or selected display currency.

#### Scenario: Aggregate includes USD and ARS records
- **WHEN** a dashboard, budget, goal, or statistics aggregate includes records stored in both USD and ARS
- **THEN** the aggregate SHALL convert all included values to one documented currency basis before summing
- **AND** the displayed currency symbol SHALL match that numeric basis

#### Scenario: Exchange rate is unavailable
- **WHEN** conversion requires USD/ARS and the backend only has a default fallback rate
- **THEN** affected responses or UI state SHALL expose that the rate is defaulted or unavailable
- **AND** the UI SHALL avoid presenting the converted value as a precise provider-backed quote

### Requirement: Analytics refresh after value changes
Home and Statistics analytics SHALL refresh or recompute when underlying financial values change, not only when collection sizes change.

#### Scenario: Transaction amount is edited
- **WHEN** a transaction amount changes while the number of transactions stays the same
- **THEN** Home and Statistics SHALL reflect the new amount after the mutation completes or the view refetches

#### Scenario: Currency or rate changes
- **WHEN** the selected currency changes or the USD/ARS rate refreshes
- **THEN** displayed financial analytics SHALL recompute using the current currency and rate state
