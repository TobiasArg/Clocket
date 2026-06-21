## ADDED Requirements

### Requirement: Goal progress is backend-owned
The backend SHALL own goal progress calculations, including saved amount, progress percentage, total saved, total target, and goal entry summaries derived from backend-owned transactions.

#### Scenario: Goals list is loaded
- **WHEN** the frontend loads the goals list
- **THEN** the backend SHALL provide each goal's saved amount and progress percentage using canonical goal-linked transaction data
- **AND** the frontend SHALL display those values without recalculating canonical progress from raw transactions

#### Scenario: Goal detail is loaded
- **WHEN** the frontend loads a goal detail view
- **THEN** the backend SHALL provide the goal's linked entry summaries, saved amount, target amount, and progress percentage
- **AND** entries SHALL be ordered and shaped consistently for the existing detail UI

### Requirement: Goal edits propagate linked entry metadata in backend
The backend SHALL own propagation of goal metadata changes to linked transactions when goal title, category, icon, or color-derived presentation metadata changes.

#### Scenario: Goal is edited with linked entries
- **WHEN** a goal with linked transactions is updated
- **THEN** the backend SHALL update the goal record
- **AND** SHALL retag linked transactions with the goal metadata required by existing UI behavior

#### Scenario: Goal edit propagation fails
- **WHEN** a linked transaction update fails during goal edit propagation
- **THEN** the backend SHALL return a controlled error
- **AND** SHALL avoid partially applying inconsistent goal/transaction state where transactionality is available

### Requirement: Goal deletion entry resolution is backend-owned
The backend SHALL own goal deletion policies for linked entries, including deleting entries, redirecting entries to another goal, and redirecting entries to an account.

#### Scenario: Delete goal and delete linked entries
- **WHEN** the frontend requests goal deletion with `delete_entries`
- **THEN** the backend SHALL delete the goal-linked transactions and the goal
- **AND** SHALL return success only after the resolution is complete

#### Scenario: Delete goal and redirect entries to another goal
- **WHEN** the frontend requests goal deletion with `redirect_goal` and a valid target goal
- **THEN** the backend SHALL retag linked entries to the target goal
- **AND** SHALL delete the source goal after entries are reassigned

#### Scenario: Delete goal and redirect entries to an account
- **WHEN** the frontend requests goal deletion with `redirect_account` and a valid target account
- **THEN** the backend SHALL clear goal linkage from linked entries
- **AND** SHALL assign the target account and a backend-controlled fallback category
- **AND** SHALL delete the source goal after entries are reassigned

### Requirement: Frontend goal flows delegate resolution to backend
The frontend SHALL delegate goal progress and entry resolution behavior to backend operations.

#### Scenario: Goal detail delete is confirmed
- **WHEN** the user confirms a goal deletion resolution mode
- **THEN** the frontend SHALL call the backend goal entry resolution operation
- **AND** SHALL NOT loop through linked transactions or create fallback categories client-side

### Requirement: Auth remains out of scope
The goal progress and entry resolution change SHALL NOT introduce authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Resolution semantics appear to require ownership
- **WHEN** a design or implementation concern would require per-user ownership to solve fully
- **THEN** the concern SHALL be documented as future work
- **AND** SHALL NOT be implemented in this change
