## Context

`restructure-backend-foundation` established tested backend service boundaries while keeping Next.js API Routes as the runtime. `design-backend-persistence-schema` selected Prisma ORM + PostgreSQL, defined clean-start persistence semantics, and has since been implemented for the core finance repositories. The backend currently contains repository modules for accounts, categories/subcategories, and transactions under `backend/src/modules/**`, but the frontend still exports localStorage repositories from `frontend/src/data/localStorage`.

Current frontend contracts are intentionally small:

- Accounts expose `list`, `getById`, `create`, `update`, `remove`, and `clearAll`; account balance is currently a `number` in the frontend domain.
- Categories expose CRUD plus `subcategories?: string[]` and `subcategoryCount`; current localStorage subcategories are names, not durable IDs.
- Transactions expose CRUD plus UI display fields (`icon`, `iconBg`, `category`, `amount`, `amountColor`, `meta`), core references (`accountId`, `categoryId`, `subcategoryName`, `goalId`, `cuotaPlanId`), `transactionType`, and a date string.
- Core clean-start keys already identify `clocket.accounts`, `clocket.categories`, and `clocket.transactions` as migration-free and legacy-ID-map-free cutover targets.

Current backend repositories expose normalized records:

- Accounts include `id`, `name`, `balance` as decimal string, `currency`, `icon`, timestamps, and `deletedAt`.
- Categories include nested subcategory records with durable `id`, `categoryId`, `name`, and `sortOrder`.
- Transactions include normalized references (`accountId`, `categoryId`, `subcategoryId`, `goalId`, `installmentPlanId`), Decimal amount string, `currency`, `date`, UI metadata fields, cuota metadata, timestamps, and repository-level reference validation errors.

## Goals / Non-Goals

**Goals:**

- Add thin Next.js API adapters for core finance domains that call backend services/repositories rather than Prisma directly.
- Keep backend services framework-independent so a future NestJS migration remains possible.
- Replace frontend localStorage repository instances for accounts, categories, and transactions with HTTP-backed repositories.
- Preserve frontend domain repository interfaces unless a minimal type adjustment is required for normalized backend data.
- Convert backend decimal/date/subcategory-ID records into the UI-facing frontend shapes at the HTTP repository boundary.
- Apply the clean-start policy: do not import localStorage records and do not preserve localStorage IDs.
- Keep auth and ownership out of scope.

**Non-Goals:**

- No user ownership, session handling, or protected multi-user API behavior.
- No localStorage import/export workflow.
- No migration of budgets, goals, cuotas, investments, settings, or statistics repositories.
- No large UI redesign or route/page rearchitecture.
- No direct Prisma imports in API route handlers.

## Decisions

### Decision 1: Add API routes before frontend cutover

Implement backend routes and tests for accounts, categories, and transactions before changing frontend repository bindings.

- Rationale: the frontend cutover should depend on stable, tested HTTP contracts rather than repository internals.
- Validation: backend tests must cover success, validation failure, missing records, soft delete, transaction reference errors, and date/decimal mapping.

### Decision 2: Keep service/repository boundaries thin and explicit

API handlers should parse HTTP requests, call domain services, and return normalized JSON. Services should call existing repositories and own cross-record validation or error mapping that is not already handled by repositories.

- Rationale: this preserves the backend-foundation rule that route handlers stay thin and Prisma remains behind repository modules.
- Alternative considered: expose repository methods directly through route handlers. Rejected because route-level validation and error mapping would become duplicated and harder to test.

### Decision 3: Frontend HTTP repositories satisfy current domain interfaces

Create frontend HTTP repository implementations for accounts, categories, and transactions that implement the existing repository interfaces where possible.

- Rationale: hooks and page models already depend on repository interfaces; replacing implementations is lower risk than rewriting UI state flows.
- Mapping rule: HTTP repositories convert backend records to existing UI/domain shapes, including numeric account balances, category `subcategories` as names, transaction `subcategoryName`, formatted `amount`, and display metadata.
- Future rule: if normalized subcategory IDs are needed in the UI, introduce the smallest interface change and update consumers in the same cutover stage.

### Decision 4: Clean-start is mandatory for these domains

On cutover, `clocket.accounts`, `clocket.categories`, and `clocket.transactions` localStorage records are not imported and local IDs are not preserved.

- Rationale: `design-backend-persistence-schema` explicitly allows clean-start cutover and existing utility code already declares these keys.
- Implementation expectation: the cutover must call or otherwise use the existing clean-start utility once the backend-backed repositories become active, or document why retaining ignored keys is safer.
- User-facing implication: the implementation PR must state that existing local-only data for these domains is not preserved.

### Decision 5: Transaction compatibility is preserved at the boundary

The backend stores canonical transaction data while the frontend may continue to use display fields.

- Amount: backend uses Decimal string; frontend repository maps to existing display `amount` and `amountColor` conventions.
- Date: backend returns date-only strings; frontend keeps `YYYY-MM-DD`.
- Subcategory: backend uses `subcategoryId`; frontend can expose `subcategoryName` by joining with category/subcategory payloads or by using API-expanded transaction records.
- Goal/cuota links: this change must not break existing optional `goalId` and `cuotaPlanId` consumers, but full goal/cuota repository migration remains deferred.

### Decision 6: Failure states must be explicit

HTTP repositories must surface controlled errors for validation, missing records, failed references, and unavailable backend responses.

- Rationale: localStorage operations were synchronous-looking and mostly always available; network persistence introduces failure modes that hooks must handle or degrade around.
- Minimal path: use existing hook error patterns where present and add narrowly scoped error handling only where required by affected pages.

## API Shape

Final route names may be adjusted during implementation, but the implementation should keep a simple REST-like boundary:

```text
GET    /api/accounts
POST   /api/accounts
GET    /api/accounts/:id
PATCH  /api/accounts/:id
DELETE /api/accounts/:id

GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PATCH  /api/categories/:id
PUT    /api/categories/:id/subcategories
DELETE /api/categories/:id

GET    /api/transactions
POST   /api/transactions
GET    /api/transactions/:id
PATCH  /api/transactions/:id
DELETE /api/transactions/:id
```

Because the backend currently uses Next.js Pages API Routes, dynamic routes should live under `backend/pages/api/**` and call extracted services under `backend/src/modules/**`.

## Migration Plan

1. Validate this OpenSpec change.
2. Add backend API request/response contracts and route-independent services for accounts.
3. Add backend API request/response contracts and route-independent services for categories/subcategories.
4. Add backend API request/response contracts and route-independent services for transactions.
5. Add frontend HTTP client helpers and HTTP repositories for accounts, categories, and transactions.
6. Switch repository exports/bindings from localStorage to HTTP repositories and trigger clean-start handling for core localStorage keys.
7. Run backend tests/build and frontend tests/typecheck/build.
8. Update implementation task checkboxes and prepare a separate implementation PR.

Rollback for the implementation stage should restore the frontend repository bindings to localStorage and leave backend API routes in place if they are harmless, or revert the implementation commit(s). Because local data may be deleted during cutover, rollback cannot guarantee restoration of pre-cutover browser-only records.

## Risks / Trade-offs

- [Risk] Existing local-only financial records are discarded. -> Mitigation: explicitly document clean-start behavior and do not promise import support.
- [Risk] Transaction UI fields may diverge from backend canonical fields. -> Mitigation: centralize mapping in frontend HTTP repositories and cover it with tests.
- [Risk] Deferred auth means all backend data remains single-ledger/single-profile. -> Mitigation: keep auth out of route contracts and create a later auth/ownership OpenSpec change.
- [Risk] Goals/cuotas still use frontend repositories while transactions can reference them. -> Mitigation: preserve optional reference fields and avoid requiring migrated goal/cuota APIs in this change.

## Open Questions

- Should transaction list responses include expanded category/subcategory display data, or should frontend HTTP repositories fetch categories separately for name mapping?
- Should account balance remain editable/manual in the frontend after backend cutover, or should it later become derived from transactions?
- Should `clearAll` remain in the frontend repository interfaces once backend persistence is active, and if so should it call a test-only/admin reset endpoint or become a no-op outside development?
