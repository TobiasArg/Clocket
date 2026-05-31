## Why

Clocket cannot safely move from browser-only storage to backend-owned financial data until the backend persistence model is specified. This change defines the Prisma ORM + PostgreSQL schema direction for core finance, budgets, goals, cuotas, investments, market snapshots, and a clean-start cutover boundary while keeping authentication explicitly out of scope.

## What Changes

- Define PostgreSQL + Prisma ORM as the persistence implementation target for the backend.
- Specify schema requirements for core financial entities: accounts, categories, subcategories, and transactions.
- Specify schema requirements for domain features: budgets, goals, installment plans/cuotas, settings, and analytics-ready data.
- Specify schema requirements for investment positions, entries, market quote snapshots, asset reference prices, and provider metadata.
- Define local development/test database expectations for future implementation.
- Define money, decimals, dates, timestamps, soft delete, foreign keys, indexes, and transaction-boundary conventions.
- Define clean-start boundaries from existing frontend `localStorage` repositories to future backend APIs; existing browser data does not need to be migrated and may be discarded at cutover.
- Non-goal: implement Prisma, PostgreSQL, migrations, generated client, or Docker Compose in this change.
- Non-goal: implement authentication, authorization, users, sessions, or multi-tenant ownership in this change.

## Capabilities

### New Capabilities

- `persistence-architecture`: Prisma/PostgreSQL conventions, environment, validation, local DB, and transaction boundaries.
- `core-finance-schema`: Schema behavior for accounts, categories, subcategories, and transactions.
- `domain-feature-schema`: Schema behavior for budgets, goals, installment plans/cuotas, settings, and future analytics.
- `investment-market-schema`: Schema behavior for investments, entries, quote snapshots, refs, and provider refresh data.
- `localstorage-clean-start-boundary`: Clean-start cutover rules from current frontend `localStorage` repositories to backend persistence.

### Modified Capabilities

- None. This change only introduces new persistence specifications.

## Impact

- Future backend files: `backend/prisma/schema.prisma`, `backend/src/persistence/**`, `backend/src/modules/**/repositories`, and backend DB tests.
- Future environment: `DATABASE_URL`, `DIRECT_URL` if needed by provider, and local PostgreSQL orchestration.
- Future frontend impact: localStorage repositories will later be replaced by HTTP repositories domain-by-domain, but this change does not modify frontend code.
- OpenSpec impact: creates a persistence schema contract that later implementation changes must satisfy.
