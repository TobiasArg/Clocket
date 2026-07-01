## Purpose

Define the versioned full JSON settings export contract, backend-canonical source boundary, integrity metadata, and CSV separation rules for Clocket backup exports.

## Requirements

### Requirement: Full settings export is versioned and self-describing
The full JSON export SHALL use a versioned contract that identifies included domains, export time, data counts, and integrity metadata.

#### Scenario: Full JSON export is generated
- **WHEN** a user generates a full JSON backup export
- **THEN** the export payload SHALL include a contract version, `exportedAt` timestamp, domain manifest, per-domain counts, and checksum or digest metadata
- **AND** SHALL include backend-canonical settings, accounts, categories, budgets, goals, cuotas, transactions, investment positions, and investment refs

#### Scenario: Export payload is inspected later
- **WHEN** maintainers inspect an exported JSON payload
- **THEN** they SHALL be able to determine the contract version, included domains, record counts, and whether integrity metadata is present without executing application code

### Requirement: Export data comes from backend-canonical sources
The export flow SHALL read migrated domain data from backend-backed HTTP/API sources and SHALL NOT compose backup data from legacy localStorage repositories.

#### Scenario: Legacy localStorage keys exist during export
- **WHEN** the browser contains legacy localStorage records for migrated domains
- **THEN** the full JSON export SHALL use backend-canonical data
- **AND** SHALL NOT include or merge legacy localStorage records

#### Scenario: Export repository defaults are inspected
- **WHEN** maintainers inspect the default export source configuration
- **THEN** every migrated domain repository used for full JSON export SHALL be HTTP/API-backed
- **AND** localStorage repositories SHALL NOT be used as default export sources

### Requirement: Partial export failures are controlled
The export flow SHALL avoid producing misleading complete backup files when required backend-canonical sections cannot be read.

#### Scenario: Required domain read fails
- **WHEN** one required domain cannot be fetched during full JSON export
- **THEN** the export flow SHALL fail with a controlled error or mark the export incomplete explicitly
- **AND** SHALL NOT silently produce a payload that appears complete

#### Scenario: Empty backend domain is valid
- **WHEN** a required domain has no records but the backend read succeeds
- **THEN** the export SHALL include that domain with an empty collection and a zero count
- **AND** SHALL still be considered complete

### Requirement: CSV export remains scoped separately from full backup
Transaction CSV export SHALL remain a transaction-focused convenience export and SHALL NOT be treated as a complete backup contract.

#### Scenario: Transaction CSV is generated
- **WHEN** a user generates the transaction CSV export
- **THEN** the export SHALL include transaction rows and headers only
- **AND** SHALL NOT claim to include settings, accounts, categories, budgets, goals, cuotas, or investments

#### Scenario: Backup completeness is required
- **WHEN** a complete backup snapshot is required
- **THEN** the full versioned JSON export contract SHALL be used instead of transaction CSV

### Requirement: Auth and import remain out of scope
The export hardening change SHALL NOT introduce import/restore, authentication, authorization, sessions, user ownership, or shared-ledger behavior.

#### Scenario: Export scope appears to require account ownership
- **WHEN** a design concern would require user identity or ownership to solve fully
- **THEN** the concern SHALL be documented as future work
- **AND** SHALL NOT be implemented in this change
