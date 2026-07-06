# settings-security-export-redaction Specification

## Purpose
TBD - created by archiving change harden-settings-security-export. Update Purpose after archive.
## Requirements
### Requirement: Settings reads redact PIN hash
Client-facing settings reads SHALL NOT expose the stored PIN hash.

#### Scenario: PIN is configured
- **WHEN** settings are read after a PIN has been configured
- **THEN** the response SHALL expose safe security metadata indicating that a PIN exists
- **AND** the response SHALL NOT include the PIN hash value

### Requirement: Backup exports redact security secrets
Full JSON backup exports SHALL NOT include PIN hashes or equivalent verifier material.

#### Scenario: Export is generated after PIN setup
- **WHEN** a full JSON backup is generated after a PIN has been configured
- **THEN** `data.settings` SHALL include only safe security metadata
- **AND** the exported JSON SHALL NOT contain `pinHash` or the stored PIN verifier value

### Requirement: Export errors are domain-aware and calm
Settings export failures SHALL preserve the failed domain internally and present calm actionable UI copy.

#### Scenario: Required settings export domain fails
- **WHEN** a required export domain cannot be read
- **THEN** the export flow SHALL fail without downloading a misleading complete backup
- **AND** the user-facing message SHALL identify the affected area or next action without exposing secrets

