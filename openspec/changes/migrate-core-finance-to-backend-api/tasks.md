## 1. OpenSpec Proposal

- [ ] 1.1 Create `migrate-core-finance-to-backend-api` proposal, design, tasks, and specs.
- [ ] 1.2 Validate with `openspec validate migrate-core-finance-to-backend-api --strict --no-interactive`.

## 2. Backend API and Service Boundaries

- [ ] 2.1 Add shared backend request parsing, response helpers, and controlled error mapping for core finance routes.
- [ ] 2.2 Add account API contracts, services, Next.js API routes, and tests for list/get/create/update/delete.
- [ ] 2.3 Add category/subcategory API contracts, services, Next.js API routes, and tests for list/get/create/update/replace-subcategories/delete.
- [ ] 2.4 Add transaction API contracts, services, Next.js API routes, and tests for list filters, get/create/update/delete, date mapping, Decimal mapping, and repository validation errors.
- [ ] 2.5 Ensure API handlers do not import Prisma directly and backend modules remain framework-independent.

## 3. Frontend HTTP Repositories

- [ ] 3.1 Add frontend HTTP client helpers for backend JSON requests and controlled error handling.
- [ ] 3.2 Implement an HTTP accounts repository that satisfies `AccountsRepository` and maps backend decimal balance strings to frontend numbers.
- [ ] 3.3 Implement an HTTP categories repository that satisfies `CategoriesRepository` and maps backend subcategory records to frontend subcategory names/counts.
- [ ] 3.4 Implement an HTTP transactions repository that satisfies `TransactionsRepository` and maps backend canonical records to existing transaction UI/domain fields.
- [ ] 3.5 Add focused frontend tests for repository mapping, network failure handling, and transaction change notification behavior.

## 4. Clean-Start Frontend Cutover

- [ ] 4.1 Switch core finance repository exports/bindings from localStorage implementations to HTTP-backed implementations.
- [ ] 4.2 Use or update `resetCoreLocalStorageForBackendCleanStart` so `clocket.accounts`, `clocket.categories`, and `clocket.transactions` are deleted or explicitly ignored at cutover.
- [ ] 4.3 Remove no-longer-used localStorage migration coupling from active core finance paths without deleting unrelated localStorage repositories.
- [ ] 4.4 Confirm affected hooks/page models keep working with asynchronous HTTP-backed repositories and explicit failure states.

## 5. Validation

- [ ] 5.1 Run `npm --prefix backend test`.
- [ ] 5.2 Run `npm --prefix backend run build`.
- [ ] 5.3 Run `npm --prefix frontend test`.
- [ ] 5.4 Run `npm --prefix frontend run typecheck` if available.
- [ ] 5.5 Run `npm --prefix frontend run build`.
- [ ] 5.6 Re-run `openspec validate migrate-core-finance-to-backend-api --strict --no-interactive`.

## 6. Explicitly Out of Scope

- [ ] 6.1 Do not implement auth, user ownership, or authorization in this change.
- [ ] 6.2 Do not import existing localStorage account/category/transaction records.
- [ ] 6.3 Do not migrate budgets, goals, cuotas, investments, settings, or statistics repositories except for compatibility with transaction references.
