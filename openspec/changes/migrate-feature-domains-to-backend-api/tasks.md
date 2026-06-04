## 1. Backend Foundation Review

- [ ] 1.1 Inventory existing backend repositories/models for budgets, goals, installment plans, investments, market snapshots/refs, and app settings.
- [ ] 1.2 Document affected localStorage repositories/keys for the feature-domain clean-start boundary.
- [ ] 1.3 Confirm shared HTTP/error helpers can be reused for feature-domain API handlers without introducing new dependencies.

## 2. Budgets, Goals, and Installments APIs

- [ ] 2.1 Add backend contracts/services/API handlers for budgets list, read, create, update, delete, and clear operations.
- [ ] 2.2 Add backend contracts/services/API handlers for goals list, read, create, update, delete, and clear operations.
- [ ] 2.3 Add backend contracts/services/API handlers for installment plan/cuota list, read, create, update, delete, and clear operations.
- [ ] 2.4 Add backend validation for money, month/date values, category/subcategory references, scope rules, and installment counts.
- [ ] 2.5 Add backend tests for budgets, goals, and installment API happy paths, validation failures, not-found cases, and unsupported methods.
- [ ] 2.6 Validate stage with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Investments and Settings APIs

- [ ] 3.1 Add backend contracts/services/API handlers for investment positions and entries.
- [ ] 3.2 Add backend contracts/services/API handlers for investment snapshots and asset reference prices.
- [ ] 3.3 Add or complete backend repository/service behavior for app settings get, update, and reset.
- [ ] 3.4 Add backend contracts/services/API handlers for app settings get, update, and reset.
- [ ] 3.5 Add backend validation for investment asset types, tickers, entry types, prices, timestamps, and settings enum/profile/security fields.
- [ ] 3.6 Add backend tests for investments, snapshots/refs, and settings API happy paths, validation failures, not-found cases, and unsupported methods.
- [ ] 3.7 Validate stage with `npm --prefix backend test` and `npm --prefix backend run build`.

## 4. Frontend HTTP Repositories

- [ ] 4.1 Add HTTP-backed budgets repository that satisfies `BudgetsRepository` and maps backend payloads to current domain shapes.
- [ ] 4.2 Add HTTP-backed goals repository that satisfies `GoalsRepository` and maps backend payloads to current domain shapes.
- [ ] 4.3 Add HTTP-backed cuotas repository that satisfies `CuotasRepository` and maps backend payloads to current domain shapes.
- [ ] 4.4 Add HTTP-backed investments repository that satisfies `InvestmentsRepository` for positions, entries, snapshots, and refs.
- [ ] 4.5 Add HTTP-backed app settings repository that satisfies `AppSettingsRepository`.
- [ ] 4.6 Add frontend repository tests for payload mapping, empty states, validation/network errors, and not-found/null behavior.
- [ ] 4.7 Validate stage with `npm --prefix frontend test` and `npm --prefix frontend run build`.

## 5. Frontend Cutover and Clean Start

- [ ] 5.1 Switch active budgets bindings from localStorage to HTTP repositories and verify budget page models/hooks still compile.
- [ ] 5.2 Switch active goals bindings from localStorage to HTTP repositories and verify goal page models/hooks still compile.
- [ ] 5.3 Switch active cuotas bindings from localStorage to HTTP repositories and verify plans page models/hooks still compile.
- [ ] 5.4 Switch active investments bindings from localStorage to HTTP repositories and verify investments page models/hooks still compile.
- [ ] 5.5 Switch active app settings bindings from localStorage to HTTP repositories and verify settings/currency hooks still compile.
- [ ] 5.6 Add or extend clean-start utilities so migrated feature-domain localStorage records are ignored or cleared after cutover.
- [ ] 5.7 Add or update affected hook/page-model tests for migrated feature-domain loading, empty, error, create, update, and delete behavior.
- [ ] 5.8 Validate stage with `npm --prefix frontend test` and `npm --prefix frontend run build`.

## 6. Final Verification

- [ ] 6.1 Run `npm --prefix backend test`.
- [ ] 6.2 Run `npm --prefix backend run build`.
- [ ] 6.3 Run `npm --prefix frontend test`.
- [ ] 6.4 Run `npm --prefix frontend run build`.
- [ ] 6.5 Run `openspec validate migrate-feature-domains-to-backend-api --strict --no-interactive`.
- [ ] 6.6 Manually verify migrated budgets, goals, cuotas, investments, and settings flows against backend APIs.
- [ ] 6.7 Document any structural deviations, validation gaps, and rollback notes in the implementation PR.
