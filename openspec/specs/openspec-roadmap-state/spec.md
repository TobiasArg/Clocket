# openspec-roadmap-state Specification

## Purpose
TBD - created by archiving change repair-openspec-roadmap-state. Update Purpose after archive.
## Requirements
### Requirement: OpenSpec context matches current architecture
OpenSpec project context SHALL describe the current persisted architecture and active boundaries accurately enough for future agents to plan changes safely.

#### Scenario: Maintainer reads project context
- **WHEN** a maintainer reads `openspec/config.yaml`
- **THEN** the context SHALL describe backend-owned persistence and frontend HTTP repository usage as the current state
- **AND** stale statements that localStorage owns most financial data SHALL be removed or reframed as archived history

### Requirement: Implementation order reflects real roadmap state
The implementation order SHALL distinguish completed archived work, active work, and future-gated work accurately.

#### Scenario: Maintainer reads implementation order
- **WHEN** a maintainer reads `openspec/changes/IMPLEMENTATION_ORDER.md`
- **THEN** completed archived changes SHALL NOT be listed as pending
- **AND** `add-auth-user-ownership` SHALL remain explicitly future-gated unless product activates it

### Requirement: Canonical specs have useful purposes
Canonical specs SHALL include concise purpose statements that explain why each capability exists.

#### Scenario: Canonical specs are inspected
- **WHEN** maintainers inspect canonical specs under `openspec/specs/`
- **THEN** placeholder purpose text SHALL be replaced with meaningful capability descriptions

### Requirement: Capabilities are traceable to validation
Implemented capabilities SHALL have lightweight traceability to representative automated or manual validation.

#### Scenario: Future change is prepared
- **WHEN** a future implementation touches an existing capability
- **THEN** maintainers SHALL be able to identify representative tests or manual QA scenarios for that capability

