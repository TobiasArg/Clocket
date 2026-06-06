## Why

Clocket just migrated the remaining feature domains from browser `localStorage` toward backend-owned APIs and HTTP repositories. That was a structural migration across budgets, goals, cuotas/installments, investments, market snapshots/refs, and app settings. Before any new product feature or auth/user-ownership work, the migrated flows need a stabilization pass to confirm real runtime behavior, persistence after refresh, frontend interactions, and UI/UX continuity.

This change exists to find and fix regressions introduced by the backend cutover while keeping scope narrow: make current functionality work reliably with backend as canonical source of truth.

## What Changes

- Audit and stabilize migrated backend API flows for budgets, goals, installments, investments, snapshots/refs, and settings.
- Audit and stabilize frontend HTTP repository mappings, hooks, page models, and active bindings for the migrated domains.
- Verify key UI interactions still work: buttons, forms, loading states, empty states, error states, navigation, and refresh behavior.
- Verify clean-start behavior when legacy feature-domain `localStorage` records are present.
- Add or adjust tests only for regressions and behavior gaps found during the stabilization pass.
- Document manual QA evidence, known gaps, and rollback notes.

## Non-Goals

- No authentication, sessions, authorization, user ownership, multi-tenant data scoping, or account management.
- No new product features or UI redesigns.
- No automated migration/import of legacy `localStorage` feature-domain records.
- No replacement of Next.js Pages API Routes.
- No persistence schema redesign unless a bug blocks existing migrated functionality.
- No broad refactor unrelated to stabilization findings.

## Capabilities

### New Capabilities

- `feature-domain-runtime-stability`: Runtime API/data stability requirements for migrated backend-owned feature domains.
- `frontend-feature-flow-regression`: Frontend interaction and repository cutover regression requirements.
- `feature-domain-clean-start-verification`: Verification requirements for legacy localStorage clean-start behavior.
- `manual-qa-validation`: Manual QA evidence and validation requirements for migrated flows.

### Modified Capabilities

- None. This change stabilizes the recently implemented migration without expanding product scope.

## Impact

- Backend: feature-domain API handlers, services, contracts, repositories, validation behavior, and tests.
- Frontend: HTTP repositories, hooks/page models, active repository exports, UI forms/buttons/states, and tests.
- Data flow: backend-generated IDs, decimal/string/number mapping, category/subcategory references, cuota transaction compatibility, investment snapshot/ref consistency, and settings persistence.
- Validation: backend tests/build, frontend tests/build, OpenSpec strict validation, and manual UI/API QA evidence.
