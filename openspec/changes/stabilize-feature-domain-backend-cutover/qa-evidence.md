## QA Evidence

Date: 2026-06-07; continued 2026-06-08

## Automated Backend/API Stabilization

- Added migrated feature-domain API handler smoke coverage for:
  - budgets collection/item list, create, update, delete, clear, unsupported method, controlled validation error mapping
  - goals collection/item list, create, update, delete, clear
  - installments/cuotas collection/item list, create, update, delete, clear
  - investments positions, entries, snapshots, latest snapshot, refs, daily refs, monthly refs, delete, clear
  - settings get, update, delete reset, post reset
- Validation command:
  - `npm --prefix backend test` — passed, 23 files / 97 tests passed, 1 skipped
  - `npm --prefix backend run typecheck` — passed
  - `npm --prefix backend run build` — passed

## Automated Frontend/Data-Flow Stabilization

- Fixed settings export to use the active HTTP-backed repositories instead of stale `localStorage` repositories after backend cutover.
- Added dependency injection for export repository tests while preserving HTTP repositories as production defaults.
- Added regression coverage proving default export sources are HTTP repositories.
- Applied backend-loaded settings theme through the global provider so persisted backend theme state is reflected after settings load, not only after settings page edits.
- Fixed cuotas/installments paid-count auto-sync so it only PATCHes backend when elapsed installments exceed the persisted paid count.
- Validation command:
  - `npm --prefix frontend test` — passed, 21 files / 79 tests passed
  - `npm --prefix frontend run typecheck` — passed
  - `npm --prefix frontend run lint` — passed
  - `npm --prefix frontend run build` — passed

## Browser UI Stabilization QA

- Ran headless Chromium QA against the Vite frontend with mocked HTTP API responses for migrated feature-domain endpoints.
- Verified migrated pages render without page crashes for:
  - `/budgets`
  - `/goals`
  - `/plans`
  - `/investments`
  - `/settings`
- Verified mocked CRUD/create and route reload visibility for:
  - budgets create via HTTP-backed `/api/budgets`, backend-style `budget-backend-1` ID, route reload still renders `QA Budget`
  - goals create via HTTP-backed `/api/goals`, backend-style `goal-backend-1` ID, route reload still renders `QA Goal`
  - cuotas create via HTTP-backed `/api/installments`, backend-style `installment-backend-1` ID, route reload still renders `QA Cuota`
  - investments add-entry via HTTP-backed `/api/investments/entries`, backend-style `position-backend-1` / `entry-backend-1` IDs, route reload still renders `AAPL`
  - settings currency sheet opens and renders backend-loaded `ARS` state
- Verified primary create actions fired exactly once for budgets, goals, cuotas, and investment entries in the mocked browser run.
- Verified cuotas auto-sync did not loop after the fix (`PATCH /api/installments/installment-backend-1` was not called more than once).
- Command pattern:
  - `python3 /Users/argtobias/.agents/skills/webapp-testing/scripts/with_server.py --server "npm --prefix frontend run dev:ui -- --host 127.0.0.1" --port 5173 --timeout 60 -- bash -lc 'NODE_PATH="/var/folders/nh/pdv3nwtx327dn_nb9d3v3xc80000gn/T/opencode/clocket-playwright/node_modules" node <<"NODE" ... NODE'` — passed

## Clean-Start Verification

- Added feature-domain clean-start test coverage for legacy keys:
  - `clocket.budgets`
  - `clocket.goals`
  - `clocket.cuotas`
  - `investments.positions`
  - `investments.entries`
  - `investments.snapshots`
  - `investments.refs`
  - `clocket.settings`
- Verified feature clean-start removes migrated legacy feature keys while leaving core keys to the separate core cutover path.

## OpenSpec Validation

- `openspec validate stabilize-feature-domain-backend-cutover --strict --no-interactive` — passed before implementation.
- `openspec validate stabilize-feature-domain-backend-cutover --strict --no-interactive` — passed after implementation and task evidence update.

## Bugs Fixed

1. **Settings export read from localStorage after backend cutover**
   - Before: `settingsExport.ts` imported repositories from `@/data/localStorage`.
   - After: export uses active HTTP repositories from `@/data/http`.
   - Risk addressed: exported backup could omit backend-canonical budgets, goals, cuotas, investments, transactions, or settings after legacy localStorage keys were cleared.

2. **Backend-persisted theme was not globally applied after settings load**
   - Before: initial theme came from legacy `clocket.settings` localStorage and settings page edits applied theme manually.
   - After: `CurrencyProvider` applies `settings.theme` whenever backend settings load or change.
   - Risk addressed: theme persistence could work in backend while UI remained visually stale until manual settings interaction.

3. **Cuotas paid-count auto-sync could loop PATCH requests**
   - Before: `usePlansPageModel` auto-synced plans when category/subcategory metadata was absent, even if the paid count was already current.
   - After: auto-sync only PATCHes when the computed elapsed paid count is greater than the persisted `paidInstallmentsCount`.
   - Risk addressed: creating or loading backend-owned cuotas without category metadata could trigger repeated `/api/installments/:id` PATCH requests.

## Known Gaps / Pending Manual QA

- Live API smoke testing against Postgres was not completed because Docker daemon was unavailable:
  - Attempted: `docker compose up -d postgres`
  - Result: `Cannot connect to the Docker daemon at unix:///Users/argtobias/.docker/run/docker.sock. Is the docker daemon running?`
- DB smoke testing with explicit local URLs was also blocked because no Postgres process was reachable on `127.0.0.1:5433`:
  - Attempted: `DATABASE_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public" DIRECT_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public" npm --prefix backend run test:db`
  - Result: `Can't reach database server at 127.0.0.1:5433`
- Browser-based QA was completed against mocked HTTP APIs, but not against a live backend/Postgres stack because the database remained unavailable.
- Pending manual verification remains required for full archival:
  - budgets, goals, cuotas, investments, and settings end-to-end UI CRUD flows against live backend persistence
  - browser refresh persistence against a live backend database
  - desktop/mobile visual pass
  - live provider behavior for market quote refresh, if API key is available

## Rollback Notes

- Roll back by reverting the stabilization commits/files only.
- No localStorage-to-backend data merge was introduced.
- No auth, sessions, authorization, or user ownership semantics were introduced.
