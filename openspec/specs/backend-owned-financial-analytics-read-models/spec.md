# backend-owned-financial-analytics-read-models Specification

## Purpose
Define backend-owned financial analytics read models for home and statistics experiences so canonical totals, buckets, and fallback behavior are produced by the backend while the frontend remains presentation-only.

## Requirements
### Requirement: Financial analytics read models are backend-owned
The backend SHALL own canonical financial analytics read models for home and statistics views, including monthly balances, income/expense totals, category breakdowns, account summaries, cash-flow buckets, and goal savings trends.

#### Scenario: Home summary is requested
- **WHEN** the frontend requests the home analytics summary
- **THEN** the backend SHALL return canonical total balance, monthly income, monthly expense, spending categories, recent transaction summary data, goal progress summary, and pending installment summary
- **AND** the frontend SHALL map the response to existing home UI behavior without recomputing canonical totals

#### Scenario: Statistics summary is requested
- **WHEN** the frontend requests statistics analytics with a valid scope and chart view
- **THEN** the backend SHALL return category rows, donut segments, flow data, trend points, monthly balance, savings totals, and transaction counts for the requested scope
- **AND** the response SHALL use stable keys/ranges so frontend labels remain presentation-only

### Requirement: Analytics calculations use backend-canonical financial rules
The backend SHALL define income, expense, savings, net balance, category grouping, and goal-progress calculation rules from backend-owned records.

#### Scenario: Goal-linked saving transactions exist
- **WHEN** analytics include transactions linked to goals or marked as savings
- **THEN** the backend SHALL apply one canonical rule for whether those amounts contribute to spending, savings, cash-flow, and goal trend buckets
- **AND** SHALL return enough metadata for the frontend to display existing savings and goal trend components

#### Scenario: Category reference is missing or deleted
- **WHEN** an analytics calculation encounters a transaction with a missing category reference
- **THEN** the backend SHALL place the value in a controlled fallback category bucket
- **AND** SHALL NOT fail the entire analytics response

### Requirement: Analytics date buckets are deterministic
The backend SHALL produce deterministic date and month buckets for analytics responses.

#### Scenario: Monthly scope is selected
- **WHEN** analytics are requested for monthly scope
- **THEN** the backend SHALL include transactions whose effective transaction date falls within the current month window
- **AND** SHALL exclude transactions outside that month window

#### Scenario: Trend view is selected
- **WHEN** statistics trend data is requested for day, week, or month view
- **THEN** the backend SHALL return ordered buckets with explicit range start/end keys and computed values
- **AND** empty buckets SHALL be represented with zero values rather than omitted

### Requirement: Frontend analytics cutover preserves existing presentation
The frontend SHALL consume backend analytics read models and preserve existing home/statistics UI presentation.

#### Scenario: Backend analytics response contains serialized money values
- **WHEN** the frontend receives decimal/string money values from analytics endpoints
- **THEN** it SHALL map them to existing display labels and chart values at the data boundary
- **AND** SHALL avoid recomputing canonical totals from raw transactions

#### Scenario: Analytics endpoint returns empty data
- **WHEN** the backend returns an empty analytics response for a clean-start ledger
- **THEN** the frontend SHALL render existing empty/zero states without crashing

### Requirement: Auth remains out of scope
The analytics read-model change SHALL NOT introduce authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Analytics scoping appears to require user identity
- **WHEN** a design or implementation concern would require per-user ownership to solve fully
- **THEN** the concern SHALL be documented as future work for the auth/ownership change
- **AND** SHALL NOT be implemented in this change
