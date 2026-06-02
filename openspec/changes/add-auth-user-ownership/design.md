## Context

`restructure-backend-foundation` explicitly kept authentication out of scope while selecting Next.js API Routes, TypeScript service boundaries, Prisma ORM, and PostgreSQL as the backend direction. `design-backend-persistence-schema` then specified the financial schema while stating that auth/user/session tables and ownership would be introduced by a later OpenSpec change.

The current `backend/prisma/schema.prisma` implements finance persistence without `User`, `Session`, or `userId` ownership columns. The tables that currently represent user-private financial data are `Account`, `Category`, `Subcategory`, `Transaction`, `Budget`, `BudgetScopeRule`, `BudgetScopeSubcategory`, `Goal`, `InstallmentPlan`, `InvestmentPosition`, `InvestmentEntry`, and `AppSettings`. `InvestmentAsset`, `MarketQuoteSnapshot`, and potentially `InvestmentAssetRef` are candidates for shared market/reference data, but position/entry ownership must remain private.

## Goals / Non-Goals

**Goals:**

- Specify future auth/session requirements before any production multi-user persistence release.
- Define which tables require user ownership and how shared/reference market data is separated.
- Define migration boundaries from the current single-profile schema to user-owned rows.
- Require route, service, and repository authorization checks that prevent cross-user reads and writes.
- Require tests that prove user A cannot access user B's data.
- Keep the design compatible with Next.js API Routes and framework-independent service/repository modules.

**Non-Goals:**

- No application-code implementation in this change.
- No Prisma migration file in this change.
- No auth provider/vendor selection until product requirements are ready.
- No team/shared-ledger or household collaboration model unless a later product change adds it explicitly.
- No import of existing localStorage data; the clean-start persistence boundary still applies unless superseded.

## Decisions

### Decision 1: Authenticated user identity is required for private finance APIs

Every backend API that reads or mutates persisted private finance data must resolve an authenticated user identity before calling domain services.

- Rationale: Financial data is private by default and cannot rely on frontend-side filtering.
- Runtime boundary: API route adapters resolve a request auth context and pass only a trusted `userId` or user context into services/repositories.
- Vendor boundary: product requirements may later choose first-party sessions, Auth.js/NextAuth, Clerk, Supabase Auth, or another provider; the domain layer must not depend on provider-specific request objects.

### Decision 2: Ownership is per user, not per shared ledger for the first auth phase

The first auth phase should scope private financial data to a single owning user.

- Rationale: The current product is personal finance, and team/household sharing is not specified.
- Future compatibility: if shared ledgers are required later, a new change can introduce `Ledger`, membership, roles, and resource ownership by ledger instead of direct user ownership.
- Constraint: do not add collaboration abstractions before product requirements require them.

### Decision 3: Shared market reference data remains unowned when safe

Market instruments and quote snapshots may remain shared reference/cache data, while user portfolio rows remain owned.

- Shared candidates: `InvestmentAsset`, `MarketQuoteSnapshot`, and `InvestmentAssetRef` can be global if they contain only normalized ticker/reference prices and no user-private holdings.
- Owned rows: `InvestmentPosition` and `InvestmentEntry` must include user ownership because they reveal holdings, trade history, and generated financial transactions.
- Safety rule: any market row that stores user-specific provider state, watchlists, refresh preferences, or private notes must become owned or be split into an owned table.

### Decision 4: Add ownership columns with scoped unique constraints

User-owned tables must add a required `userId` relation and update uniqueness/indexes that currently assume a single profile.

- Examples: `Subcategory` uniqueness changes from `[categoryId, name]` to a user-safe constraint through the owned category relation or explicit `[userId, categoryId, name]`.
- Examples: `InvestmentPosition` uniqueness changes from `[assetId]` to `[userId, assetId]`.
- Examples: `AppSettings(id = "default")` is replaced with one settings row per user, such as unique `[userId]`.
- Route contract: client-provided `userId` must not be trusted for ownership; the backend derives it from session context.

### Decision 5: Migration backfill must be explicit and environment-aware

Moving from the current unowned schema to user-owned rows requires a controlled backfill policy.

- Development/test: migrations may create a deterministic seed/test user and attach existing rows when preserving local test fixtures is useful.
- Production before real users: a clean database or single bootstrap user may be acceptable if no real user data exists.
- Production with real data: implementation must define a one-time ownership assignment or block migration until each row can be mapped to a user.
- Rollback: ownership migrations must include rollback notes and avoid silent data merging across users.

### Decision 6: Authorization checks belong at API and repository boundaries

API route adapters must reject unauthenticated requests before private services run, and repositories must include `userId` filters on every user-owned query.

- Rationale: double scoping reduces accidental leakage when a service is reused.
- Error policy: unauthenticated requests return a controlled `401`; authenticated users accessing missing or foreign resources return `404` by default to avoid confirming resource existence, unless product requirements choose `403` for a specific route.
- Mutation policy: writes that reference related rows must verify all referenced IDs belong to the same authenticated user before committing.

### Decision 7: Auth does not change clean-start localStorage migration by default

The existing clean-start boundary remains: existing browser localStorage data does not need to be imported into backend persistence unless a later product requirement explicitly adds import/export.

- Rationale: importing local data into a newly authenticated account has conflict, trust, and data-quality implications.
- Frontend expectation: auth implementation must clearly communicate whether existing local data is ignored, cleared, retained as a temporary fallback, or offered for optional import by a separate change.

## Ownership Migration Map

```text
User-owned tables:
User, Account, Category, Subcategory, Transaction, Budget, BudgetScopeRule,
BudgetScopeSubcategory, Goal, InstallmentPlan, InvestmentPosition,
InvestmentEntry, AppSettings

Shared/reference candidates:
InvestmentAsset, MarketQuoteSnapshot, InvestmentAssetRef

Auth/session tables:
User plus provider-specific account/session/token tables, or equivalent managed-auth mappings.
```

## Risks / Trade-offs

- [Risk] Direct `userId` ownership can be too narrow if shared ledgers become a near-term requirement. Mitigation: keep this change product-ready but require a superseding OpenSpec change before implementing teams/households.
- [Risk] Adding ownership after unowned Prisma tables requires careful constraint migrations. Mitigation: require explicit backfill and unique-index updates in the implementation tasks.
- [Risk] Shared market quote data could accidentally include private preferences later. Mitigation: require new owned tables for any user-specific market data.
- [Risk] Auth provider choice can leak into domain services. Mitigation: keep provider-specific code in auth adapters and pass only normalized identity into services.

## Migration Plan

1. Finalize product requirements for auth method, sign-up policy, account recovery, and session lifetime.
2. Select auth provider/session implementation through a small design decision if needed.
3. Add auth/session schema or provider mappings and a `User` model.
4. Add `userId` ownership columns, relations, scoped indexes, and scoped uniqueness for all private tables.
5. Define and run an environment-appropriate data backfill.
6. Update repositories and services to require authenticated user context and scope every query/mutation.
7. Update API routes to reject unauthenticated private requests and normalize auth errors.
8. Update frontend session handling and HTTP repository behavior.
9. Validate cross-user isolation, migration safety, and route-level auth behavior.

Rollback for this future implementation is not trivial once user data exists. Implementation changes must provide migration rollback notes, backup guidance, and a safe path for non-production environments.

## Open Questions

- Which auth method should Clocket use: email/password, passwordless email, OAuth, managed auth, or a hybrid?
- Are accounts strictly personal, or is household/shared-ledger collaboration planned?
- Should the first authenticated user receive any existing unowned rows in non-production environments?
- What session lifetime, refresh, revocation, and device-management behavior does the product require?
- Should localStorage data ever be importable into an authenticated account, or is clean start permanent?
