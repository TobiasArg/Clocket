## 1. Backend Foundation Review

- [x] 1.1 Inventory existing backend repositories/models for budgets, goals, installment plans, investments, market snapshots/refs, and app settings.
- [x] 1.2 Document affected localStorage repositories/keys for the feature-domain clean-start boundary.
- [x] 1.3 Confirm shared HTTP/error helpers can be reused for feature-domain API handlers without introducing new dependencies.

## 2. Budgets, Goals, and Installments APIs

- [x] 2.1 Add backend contracts/services/API handlers for budgets list, read, create, update, delete, and clear operations.
- [x] 2.2 Add backend contracts/services/API handlers for goals list, read, create, update, delete, and clear operations.
- [x] 2.3 Add backend contracts/services/API handlers for installment plan/cuota list, read, create, update, delete, and clear operations.
- [x] 2.4 Add backend validation for money, month/date values, category/subcategory references, scope rules, and installment counts.
- [x] 2.5 Add backend tests for budgets, goals, and installment API happy paths, validation failures, not-found cases, and unsupported methods.
- [x] 2.6 Validate stage with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Investments and Settings APIs

- [x] 3.1 Add backend contracts/services/API handlers for investment positions and entries.
- [x] 3.2 Add backend contracts/services/API handlers for investment snapshots and asset reference prices.
- [x] 3.3 Add or complete backend repository/service behavior for app settings get, update, and reset.
- [x] 3.4 Add backend contracts/services/API handlers for app settings get, update, and reset.
- [x] 3.5 Add backend validation for investment asset types, tickers, entry types, prices, timestamps, and settings enum/profile/security fields.
- [x] 3.6 Add backend tests for investments, snapshots/refs, and settings API happy paths, validation failures, not-found cases, and unsupported methods.
- [x] 3.7 Validate stage with `npm --prefix backend test` and `npm --prefix backend run build`.

## 4. Frontend HTTP Repositories

- [x] 4.1 Add HTTP-backed budgets repository that satisfies `BudgetsRepository` and maps backend payloads to current domain shapes.
- [x] 4.2 Add HTTP-backed goals repository that satisfies `GoalsRepository` and maps backend payloads to current domain shapes.
- [x] 4.3 Add HTTP-backed cuotas repository that satisfies `CuotasRepository` and maps backend payloads to current domain shapes.
- [x] 4.4 Add HTTP-backed investments repository that satisfies `InvestmentsRepository` for positions, entries, snapshots, and refs.
- [x] 4.5 Add HTTP-backed app settings repository that satisfies `AppSettingsRepository`.
- [x] 4.6 Add frontend repository tests for payload mapping, empty states, validation/network errors, and not-found/null behavior.
- [x] 4.7 Validate stage with `npm --prefix frontend test` and `npm --prefix frontend run build`.

## 5. Frontend Cutover and Clean Start

- [x] 5.1 Switch active budgets bindings from localStorage to HTTP repositories and verify budget page models/hooks still compile.
- [x] 5.2 Switch active goals bindings from localStorage to HTTP repositories and verify goal page models/hooks still compile.
- [x] 5.3 Switch active cuotas bindings from localStorage to HTTP repositories and verify plans page models/hooks still compile.
- [x] 5.4 Switch active investments bindings from localStorage to HTTP repositories and verify investments page models/hooks still compile.
- [x] 5.5 Switch active app settings bindings from localStorage to HTTP repositories and verify settings/currency hooks still compile.
- [x] 5.6 Add or extend clean-start utilities so migrated feature-domain localStorage records are ignored or cleared after cutover.
- [x] 5.7 Add or update affected hook/page-model tests for migrated feature-domain loading, empty, error, create, update, and delete behavior.
- [x] 5.8 Validate stage with `npm --prefix frontend test` and `npm --prefix frontend run build`.

## 6. Final Verification

- [x] 6.1 Run `npm --prefix backend test`.
- [x] 6.2 Run `npm --prefix backend run build`.
- [x] 6.3 Run `npm --prefix frontend test`.
- [x] 6.4 Run `npm --prefix frontend run build`.
- [x] 6.5 Run `openspec validate migrate-feature-domains-to-backend-api --strict --no-interactive`.
- [ ] 6.6 Manually verify migrated budgets, goals, cuotas, investments, and settings flows against backend APIs.
- [ ] 6.7 Document any structural deviations, validation gaps, and rollback notes in the implementation PR.
