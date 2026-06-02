## Why

Clocket's backend persistence work intentionally introduced Prisma/PostgreSQL financial tables without authentication, sessions, users, or ownership columns. That single-profile boundary is useful for early backend migration, but production persistence must eventually prevent one authenticated user from reading or mutating another user's accounts, categories, transactions, budgets, goals, installment plans, settings, and investment portfolio data.

This change defines the future authentication and user ownership proposal that must be implemented once product requirements are ready. It does not choose a vendor or implement application code; it specifies the boundaries that later implementation changes must satisfy.

## What Changes

- Define authentication/session requirements for backend API requests.
- Define the `User` ownership model and which persisted tables become user-owned versus shared/reference data.
- Define Prisma/PostgreSQL migration requirements for adding `userId` ownership columns, relations, indexes, unique constraints, and backfill behavior.
- Define API authorization boundaries so routes and repositories scope every user-owned read/write to the authenticated user.
- Define settings/profile ownership and the replacement for the current single `AppSettings(id = "default")` row.
- Define validation expectations for schema migrations, repository tests, API authorization tests, and frontend session-state behavior.
- Non-goal: implement auth providers, routes, Prisma migrations, UI login flows, or application code in this OpenSpec change.
- Non-goal: decide final product requirements such as sign-up policy, passwordless versus password auth, subscription/team sharing, or account recovery UX.

## Capabilities

### New Capabilities

- `auth-session-boundary`: Authenticated session identity and request context requirements.
- `user-owned-data-scope`: User ownership/scoping rules for financial domain data and shared reference data.
- `ownership-migration`: Prisma/PostgreSQL migration requirements for adding ownership to the current schema.
- `api-authorization-boundary`: Backend route/service/repository authorization and data-isolation requirements.
- `auth-validation`: Test and validation requirements for auth, ownership, and migration safety.

### Modified Capabilities

- None. This change introduces future auth/ownership specifications and depends on the persistence schema remaining implementation-compatible with later ownership columns.

## Impact

- Future backend files: `backend/prisma/schema.prisma`, Prisma migrations, `backend/src/modules/**`, `backend/src/persistence/**`, backend auth/session helpers, and API route adapters.
- Future frontend files: session bootstrap, login/logout screens, HTTP repository auth handling, and user-facing reset/cutover messaging.
- Persistence impact: currently unowned tables in `backend/prisma/schema.prisma` require ownership columns or shared-data classification before multi-user production use.
- Security impact: every user-owned query and mutation must be scoped by authenticated identity before exposing persisted financial data to real users.
