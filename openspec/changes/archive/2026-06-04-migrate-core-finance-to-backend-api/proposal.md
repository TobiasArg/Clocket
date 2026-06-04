## Why

Clocket now has a backend foundation, a Prisma/PostgreSQL schema direction, and backend repositories for accounts, categories/subcategories, and transactions, but the frontend still binds the core finance UI to browser `localStorage` repositories. This keeps core financial state local-only and leaves cross-domain behavior split between frontend persistence code and backend repository tests.

This change proposes the next implementation phase: expose backend API/service boundaries for the core finance domains and replace the frontend repository bindings for accounts, categories/subcategories, and transactions with HTTP-backed repositories using a clean-start cutover. Existing localStorage data does not need to be imported or mapped.

## What Changes

- Add backend API routes and service boundaries for accounts, categories/subcategories, and transactions on top of the existing backend repository modules.
- Define frontend HTTP repositories that satisfy the existing domain repository interfaces for accounts, categories, and transactions.
- Cut over the frontend from `frontend/src/data/localStorage/*Repository.ts` bindings to backend-backed repositories for the core finance domains.
- Use the existing clean-start rule for `clocket.accounts`, `clocket.categories`, and `clocket.transactions`: local browser data may be deleted or ignored and backend-generated IDs become canonical.
- Normalize API contracts so UI-facing string/display fields are mapped at the frontend boundary while backend persistence keeps Decimal amounts, typed dates, and normalized subcategory IDs.
- Preserve existing page-model and hook contracts where practical so UI changes are minimal.
- Add validation, repository/API tests, and build checks for the cutover.
- Non-goal: implement authentication, users, sessions, authorization, or multi-user ownership.
- Non-goal: import existing localStorage data or preserve legacy localStorage IDs.
- Non-goal: migrate budgets, goals, cuotas/installments, investments, settings, or statistics repositories in this change, except where transaction references must remain compatible.

## Capabilities

### New Capabilities

- `core-finance-api-service-boundary`: Backend API/service behavior for accounts, categories/subcategories, and transactions.
- `frontend-core-finance-repository-cutover`: Frontend repository replacement from localStorage implementations to HTTP-backed implementations.
- `core-finance-clean-start-cutover`: Explicit clean-start behavior and rollback constraints for the core finance cutover.

### Modified Capabilities

- None. No archived base capabilities exist in `openspec/specs/`; this change adds the implementation contract for a future phase.

## Impact

- Affected backend files: `backend/pages/api/**`, `backend/src/modules/accounts/**`, `backend/src/modules/categories/**`, `backend/src/modules/transactions/**`, backend validation helpers, and backend API tests.
- Affected frontend files: `frontend/src/data/**`, `frontend/src/domain/{accounts,categories,transactions}/repository.ts`, hooks/page models that consume those repositories, and localStorage clean-start utilities.
- Affected contracts: account balances, category/subcategory shape, transaction amount/date/type/category references, and transaction change notifications.
- Affected validation: backend tests/build, frontend tests/typecheck/build, and strict OpenSpec validation.
