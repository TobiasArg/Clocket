## Why

Clocket ya tiene persistencia backend y el cutover HTTP para core finance (`accounts`, `categories`, `transactions`), pero los dominios de producto restantes siguen usando `localStorage`. Esto deja reglas importantes de presupuestos, metas, cuotas, inversiones y settings divididas entre frontend local y backend persistente, bloqueando una app realmente backend-owned antes de auth.

## What Changes

- Add backend API/service boundaries for feature domains already modeled in Prisma repositories or schema: budgets, goals, installment plans/cuotas, investments, market snapshots/refs, and app settings.
- Add frontend HTTP repositories that satisfy existing domain repository contracts for those feature domains where practical.
- Cut over active frontend bindings from `localStorage` to backend-backed repositories domain by domain.
- Preserve existing UI/page-model contracts and asynchronous error handling patterns where practical.
- Keep clean-start semantics: do not import existing browser `localStorage` feature-domain records or preserve legacy IDs unless a domain-specific task explicitly documents compatibility needs.
- Keep auth/user ownership out of scope; all APIs remain single-ledger/single-profile until `add-auth-user-ownership` is implemented.
- Non-goal: redesign UI flows, add auth/session logic, or migrate analytics/statistics beyond making them consume backend-backed domain repositories when necessary.

## Capabilities

### New Capabilities

- `feature-domain-api-service-boundary`: Backend API/service behavior for budgets, goals, cuotas/installments, investments, market snapshots/refs, and settings.
- `frontend-feature-repository-cutover`: Frontend repository replacement from localStorage implementations to HTTP-backed implementations for feature domains.
- `feature-domain-clean-start-boundary`: Clean-start and rollback behavior for feature-domain localStorage keys and backend-generated IDs.
- `feature-domain-validation`: Validation, tests, and build expectations for the feature-domain backend/frontend migration.

### Modified Capabilities

- None. Archived changes define prior core finance and persistence contracts; this change introduces the next implementation contract for feature domains.

## Impact

- Backend: `backend/pages/api/**`, `backend/src/modules/{budgets,goals,installments,investments,settings}/**`, shared API helpers, and backend tests.
- Frontend: `frontend/src/data/http/**`, active exports/bindings in `frontend/src/utils/index.ts`, hooks/page models for budgets/goals/plans/investments/settings, and localStorage clean-start utilities.
- Data contracts: budget scope rules, goal/category synchronization, cuota-generated transaction compatibility, investment position/entry/snapshot/ref mapping, and app settings/profile shape.
- Validation: backend tests/build, frontend tests/typecheck/build, and strict OpenSpec validation.
