## Context

The backend foundation now has a typed and tested market quote boundary, but Clocket's product data still lives in frontend `localStorage`. The audit shows that local repositories implement CRUD, migrations, cascades, generated transactions, category synchronization, quote snapshots, and financial calculations in the browser. The next safe step is to design backend persistence before writing Prisma migrations or API endpoints.

Current domain contracts show these data groups:

- Accounts: name, balance, icon, timestamps.
- Categories/subcategories: visual metadata and user-editable grouping.
- Transactions: account, category/subcategory, goal/cuota links, date, type, display metadata, and amount currently stored as formatted UI string.
- Budgets: monthly limit and scope rules by category/subcategory.
- Goals: target amount, deadline, color/icon, and implicit category/subcategory behavior.
- Cuotas/installments: total amount, installment count, paid count, category/subcategory, generated transactions.
- Investments: positions, entries, snapshots, daily/month refs, and provider refresh behavior.
- Settings: currency, language, notifications, theme, profile, and local PIN hash.

## Goals / Non-Goals

**Goals:**

- Define a backend persistence schema contract before implementation.
- Use Prisma ORM and PostgreSQL as the implementation target.
- Preserve current frontend domain semantics while replacing UI-string persistence with typed financial columns.
- Specify referential integrity and transaction boundaries for multi-entity operations.
- Keep auth out of scope while documenting how future ownership must be introduced.
- Define local PostgreSQL development/test expectations for the future implementation stage.

**Non-Goals:**

- No `schema.prisma` file in this change.
- No DB migrations, generated Prisma client, Docker Compose, or runtime DB connection in this change.
- No user/auth/session tables in this change.
- No frontend repository migration in this change.
- No analytics aggregation implementation in this change.

## Decisions

### Decision 1: PostgreSQL is the persistence target

PostgreSQL is the selected database for backend financial data.

- Rationale: Clocket needs relational integrity, transactions, constraints, reporting, future audit trails, and multi-device readiness.
- Alternative considered: SQLite. Rejected as the primary target because multi-device persistence and production deployment are expected.
- Alternative considered: browser local-first only. Rejected for backend migration because current localStorage cannot provide atomic cross-entity updates or auditability.

### Decision 2: Prisma ORM is the repository implementation layer

Prisma will own schema, migrations, generated types, and DB access under `backend/src/persistence`.

- Rationale: Prisma fits the TypeScript backend, provides typed query results, and is enough before considering NestJS.
- Repository rule: API handlers must not import Prisma directly; modules call repositories/services.
- Future NestJS compatibility: repositories/services should remain framework-independent so NestJS can wrap them later if needed.

### Decision 3: UUID primary keys for backend-owned entities

Backend entities should use UUID/CUID-style string IDs at the API boundary and Prisma-generated IDs in the DB.

- Rationale: frontend already uses string IDs; preserving string IDs minimizes API churn.
- Migration note: imported localStorage IDs may be stored either as canonical IDs when valid or in `legacyId` fields during import mapping.

### Decision 4: Monetary values must be numeric decimals, not UI strings

The database must store money and asset quantities as Prisma `Decimal` mapped to PostgreSQL `numeric`.

- Rationale: current `TransactionItem.amount` is a display string, which is unsafe for persistence, filtering, aggregation, and currency conversion.
- API mapping: future API contracts may still expose formatted fields for UI convenience, but persistence stores canonical numeric amount and currency.
- Recommended precision: money uses `Decimal(18, 2)` or stricter per currency; investment quantities/prices use larger precision such as `Decimal(28, 10)`.

### Decision 5: Dates and periods are canonicalized

- Transaction dates, deadlines, and quote timestamps use explicit DB date/time columns.
- Budget months and cuota start months use a canonical month field, represented at the API as `YYYY-MM` and stored as a first-day-of-month date or constrained period string.
- Timestamps use UTC `createdAt`, `updatedAt`, and optional `deletedAt` where soft delete is required.

### Decision 6: No auth tables yet, but ownership must be a future migration boundary

This schema design must not add `User`, `Session`, or auth-owned relations yet.

- Rationale: user explicitly deferred auth.
- Future requirement: the auth OpenSpec change must add ownership/scoping to user-owned tables and update unique indexes accordingly.
- Current implementation may be single-profile/single-ledger until auth is specified.

### Decision 7: Core deletion favors restrict or soft delete over uncontrolled cascade

Financial records should not disappear silently.

- Accounts: deleting an account with transactions should be restricted or soft-deleted.
- Categories/subcategories: deletion should be restricted if referenced, or migrated through an explicit reassignment flow.
- Generated cuota/investment transactions: deleting source plans/entries must occur inside a transaction and preserve auditable linkage decisions.

## Conceptual schema blueprint

This is not implementation syntax; it is a target model map for later `schema.prisma`:

```text
Account(id, name, balance, icon, createdAt, updatedAt, deletedAt?)
Category(id, name, icon, iconBg, createdAt, updatedAt, deletedAt?)
Subcategory(id, categoryId, name, sortOrder, createdAt, updatedAt)
Transaction(id, accountId, categoryId?, subcategoryId?, goalId?, installmentPlanId?, investmentEntryId?, type, name, amount, currency, date, notes?, uiIcon?, uiIconBg?, createdAt, updatedAt, deletedAt?)
Budget(id, name, limitAmount, currency, periodMonth, createdAt, updatedAt)
BudgetScopeRule(id, budgetId, categoryId, mode)
BudgetScopeSubcategory(id, budgetScopeRuleId, subcategoryId)
Goal(id, title, description, targetAmount, currency, deadlineDate, icon, colorKey, categoryId?, createdAt, updatedAt, deletedAt?)
InstallmentPlan(id, title, description?, totalAmount, currency, installmentsCount, installmentAmount, startMonth, paidInstallmentsCount, categoryId?, subcategoryId?, createdAt, updatedAt, deletedAt?)
InvestmentAsset(id, assetType, ticker, displayName?, createdAt, updatedAt)
InvestmentPosition(id, assetId, totalInvested, averageBuyPrice, amount, createdAt, updatedAt, deletedAt?)
InvestmentEntry(id, positionId, assetId, entryType, amountUsd, buyPrice, units, transactionId?, createdAt)
MarketQuoteSnapshot(id, assetId, price, source, bid?, ask?, providerAsOf?, fetchedAt)
InvestmentAssetRef(id, assetId, dailyRefPrice, dailyRefTimestamp, monthRefPrice, monthRefTimestamp, updatedAt)
AppSettings(id, currency, language, notificationsEnabled, theme, profileName, profileEmail, avatarIcon, pinHash?, updatedAt)
ImportBatch(id, source, status, startedAt, completedAt?, summaryJson?)
LegacyIdMap(id, importBatchId?, entityType, legacyId, targetId, createdAt)
```

## Risks / Trade-offs

- [Risk] Designing without auth may require adding ownership columns later. → Mitigation: keep a single-ledger assumption explicit and require a future auth OpenSpec migration.
- [Risk] Storing `balance` on account can drift from transaction aggregates. → Mitigation: define whether balance is an opening/current manual value or derived; for phase one preserve current behavior and document reconciliation later.
- [Risk] Category/subcategory IDs differ from current subcategory-name references. → Mitigation: migration must map names to durable subcategory rows and keep `legacyId`/mapping tables.
- [Risk] Prisma cannot express all PostgreSQL check constraints directly. → Mitigation: use Prisma schema plus SQL migrations for critical constraints when needed.
- [Risk] Decimal precision mistakes can corrupt financial values. → Mitigation: specify precision per field and add repository tests for decimal round-trips.

## Migration Plan

1. Validate this OpenSpec change.
2. Create a later implementation change to add Prisma dependencies, `schema.prisma`, `.env.example` DB vars, and local PostgreSQL orchestration.
3. Implement DB connection and smoke tests without migrating frontend data.
4. Implement core repositories in order: accounts, categories/subcategories, transactions.
5. Add import/dry-run tooling for localStorage payloads.
6. Replace frontend localStorage repositories with HTTP repositories one domain at a time.

Rollback for this design-only change is a documentation revert. Later DB implementation changes must include migration rollback notes.

## Open Questions

- Should account balances remain manually stored or become derived from opening balance plus transactions?
- Should category/subcategory deletion use restrict, soft delete, or reassignment as the default UX?
- Should investment position totals be materialized or fully derived from entries?
- Should cuota-generated transactions be materialized immediately or generated on sync only?
- Which fields require immutable audit logs once auth is introduced?
