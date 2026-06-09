## 1. Backend API Stabilization

- [x] 1.1 Manually/API-test budgets list, read, create, update, delete, clear, validation errors, and refresh persistence.
- [x] 1.2 Manually/API-test goals list, read, create, update, delete, clear, category sync behavior, validation errors, and refresh persistence.
- [x] 1.3 Manually/API-test installments/cuotas list, read, create, update, delete, clear, paid count validation, category/subcategory references, and refresh persistence.
- [x] 1.4 Manually/API-test investments positions, entries, snapshots, refs, delete/clear behavior, invalid asset/ticker handling, and refresh persistence.
- [x] 1.5 Manually/API-test app settings get, update, reset, enum validation, profile/security payloads, and refresh persistence.
- [x] 1.6 Fix backend regressions found during API stabilization with minimal scoped changes.
- [x] 1.7 Add or update backend tests for any backend regression fixed in this change.

## 2. Frontend Data Flow Stabilization

- [ ] 2.1 Verify budgets UI list, create, edit, delete, empty state, error state, and browser refresh behavior.
- [ ] 2.2 Verify goals UI list, create, edit, delete, empty state, error state, category sync visibility, and browser refresh behavior.
- [ ] 2.3 Verify cuotas UI list, create, edit, delete, paid-state behavior, empty/error states, and browser refresh behavior.
- [ ] 2.4 Verify investments UI add/edit/delete position, add/delete entry, refresh market data, snapshots/refs, empty/error states, and browser refresh behavior.
- [ ] 2.5 Verify settings UI load, update, reset, currency, theme, profile, security PIN behavior, and browser refresh behavior.
- [x] 2.6 Fix frontend repository mapping or hook/page-model regressions found during UI stabilization.
- [x] 2.7 Add or update frontend tests for any frontend regression fixed in this change.

## 3. UI/UX Regression Pass

- [ ] 3.1 Verify navigation among primary pages after migrated domains load from backend.
- [ ] 3.2 Verify primary and secondary buttons in migrated flows trigger the expected actions exactly once.
- [ ] 3.3 Verify forms preserve existing validation UX and do not submit invalid data silently.
- [ ] 3.4 Verify loading, empty, and error states are visible, stable, and non-alarming.
- [ ] 3.5 Verify migrated flows do not crash on null/undefined backend references.
- [ ] 3.6 Verify basic desktop and mobile layouts for migrated pages remain usable.

## 4. Clean Start and Persistence Verification

- [x] 4.1 Seed or simulate legacy feature-domain localStorage keys and verify the app ignores or clears them after cutover.
- [x] 4.2 Confirm newly created migrated-domain records use backend-generated IDs only.
- [x] 4.3 Confirm backend data remains after browser refresh and does not rely on localStorage records.
- [x] 4.4 Confirm rollback guidance remains repository-binding revert only, not data merge.

## 5. Final Validation

- [x] 5.1 Run `npm --prefix backend test`.
- [x] 5.2 Run `npm --prefix backend run build`.
- [x] 5.3 Run `npm --prefix frontend test`.
- [x] 5.4 Run `npm --prefix frontend run build`.
- [x] 5.5 Run `openspec validate stabilize-feature-domain-backend-cutover --strict --no-interactive`.
- [x] 5.6 Document manual QA evidence, bugs fixed, known gaps, and rollback notes before archival.
