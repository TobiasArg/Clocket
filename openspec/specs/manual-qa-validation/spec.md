# manual-qa-validation Specification

## Purpose
Define manual QA and evidence expectations for migrated feature-domain flows so stabilization work remains reviewable and auth/user ownership stays out of scope.

## Requirements
### Requirement: Manual QA covers migrated feature flows
The stabilization SHALL include manual QA evidence for migrated feature-domain flows and affected UI interactions.

#### Scenario: Manual QA is performed for migrated domains
- **WHEN** maintainers perform stabilization QA
- **THEN** they SHALL verify budgets, goals, cuotas/installments, investments, snapshots/refs, and settings flows for list, create/update, delete/reset, empty state, error state, and refresh persistence where applicable

#### Scenario: Manual QA finds a regression
- **WHEN** manual QA identifies a backend, frontend data flow, or UI interaction regression
- **THEN** the regression SHALL be documented, fixed with a minimal scoped change when in scope, and covered by automated tests when practical

### Requirement: Validation evidence is documented
The stabilization SHALL document automated and manual validation results before archival.

#### Scenario: Stabilization is ready for review
- **WHEN** the stabilization implementation is complete
- **THEN** maintainers SHALL document backend test/build, frontend test/build, OpenSpec strict validation, manual QA coverage, known gaps, and rollback notes

### Requirement: Auth remains out of scope
The stabilization SHALL NOT introduce authentication, authorization, sessions, or user ownership behavior.

#### Scenario: A stabilization issue appears related to user ownership
- **WHEN** a finding would require user ownership or auth semantics to solve fully
- **THEN** the finding SHALL be documented as out of scope and SHALL NOT be implemented in this stabilization change
