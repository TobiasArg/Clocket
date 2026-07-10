# ci-quality-gates-hardening Specification

## Purpose
TBD - created by archiving change harden-ci-quality-gates. Update Purpose after archive.
## Requirements
### Requirement: CI validates frontend quality gates
CI SHALL run frontend tests, typecheck, lint, production build, and bundle budget checks for relevant frontend changes.

#### Scenario: Frontend pull request changes app code
- **WHEN** a pull request changes frontend source, config, tests, or package files
- **THEN** CI SHALL run frontend test, typecheck, lint, and build/bundle validation
- **AND** the pull request SHALL fail if any required frontend gate fails

### Requirement: CI validates backend quality gates
CI SHALL run backend tests, typecheck, Prisma validation, and production build for relevant backend changes.

#### Scenario: Backend pull request changes API or persistence code
- **WHEN** a pull request changes backend source, Prisma schema, config, tests, or package files
- **THEN** CI SHALL run backend test, typecheck, Prisma validate, and build validation
- **AND** the pull request SHALL fail if any required backend gate fails

### Requirement: CI validates OpenSpec state
CI SHALL validate OpenSpec changes and canonical specs in strict non-interactive mode.

#### Scenario: OpenSpec files change
- **WHEN** a pull request changes files under `openspec/`
- **THEN** CI SHALL run strict OpenSpec validation for active changes and canonical specs
- **AND** invalid specs or malformed change artifacts SHALL block the pull request

### Requirement: DB smoke is automated for persistence-sensitive changes
Persistence-sensitive backend changes SHALL have an automated PostgreSQL smoke path.

#### Scenario: Prisma schema or persistence tests change
- **WHEN** a pull request changes Prisma schema, migrations, or persistence tests
- **THEN** CI SHALL run the database smoke tests against a disposable PostgreSQL service

