## QA Evidence

Date: 2026-06-07; continued 2026-06-08

## Live Postgres / Backend Environment Unblocked

- Docker/Postgres is now available for live QA:
  - `docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'` — `clocket-postgres`, `postgres:16-alpine`, `Up ... (healthy)`, `0.0.0.0:5433->5432/tcp`
  - `nc -z 127.0.0.1 5433` — `postgres-open`
  - `nc -z 127.0.0.1 3001` — `backend-open`
- Prisma migration state is current against the live local database:
  - `DATABASE_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public" DIRECT_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public" npm exec prisma migrate status` from `backend/` — `Database schema is up to date!`
- Backend health check endpoint responds:
  - `curl --fail --silent --show-error "http://127.0.0.1:3001/api/hello"` — `{"message":"Hola desde Next.js API"}`
- Database smoke tests now pass against live local Postgres:
  - `DATABASE_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public" DIRECT_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public" npm --prefix backend run test:db` — passed, 2 files / 4 tests passed

## Live Backend API QA

- Ran live API QA against managed backend dev server and local Postgres using:
  - `DATABASE_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public"`
  - `DIRECT_URL="postgresql://clocket:clocket@127.0.0.1:5433/clocket_dev?schema=public"`
  - `python3 /Users/argtobias/.agents/skills/webapp-testing/scripts/with_server.py --server "... npm --prefix backend run dev" --port 3001 --timeout 90 -- node ...`
- Run ID: `qa-1781010622931`
- Passed live API checks:
  - budgets list, read-after-write, create, update, delete, clear, invalid payload validation, backend-generated ID verification
  - goals list, read-after-write, create, update, delete, clear, category/subcategory sync behavior, invalid payload validation, backend-generated ID verification
  - installments/cuotas list, read-after-write, create, update, delete, clear, paid count validation, backend-generated ID verification
  - investments add/delete entry, add/read/update/delete position, snapshots list/create/latest, refs get/init/update daily/update monthly, clear, invalid asset validation, backend-generated ID verification
  - settings get, update, read-after-write persistence, reset, invalid enum validation, profile/security payload update, restoration of original settings
- Clear behavior executed because the active migrated-domain lists were empty at the start of each clear check.
- No backend regressions were found during live API QA.

## Live Browser UI QA Against Backend

- Ran headless Chromium against Vite frontend proxied to the live backend/Postgres stack using:
  - `python3 /Users/argtobias/.agents/skills/webapp-testing/scripts/with_server.py --server "... npm --prefix backend run dev" --port 3001 --server "npm --prefix frontend run dev:ui -- --host 127.0.0.1" --port 5173 --timeout 90 -- bash -lc 'NODE_PATH="/var/folders/nh/pdv3nwtx327dn_nb9d3v3xc80000gn/T/opencode/clocket-playwright/node_modules" node <<"NODE" ... NODE'`
- Run ID: `uiqa-1781011167673`
- Passed live browser checks:
  - budgets page rendered, empty-to-filled create flow succeeded through HTTP backend, selected live category/subcategory, route reload preserved the created budget, backend ID verified
  - goals page rendered, create flow succeeded through HTTP backend, route reload preserved the goal, backend ID and category sync verified, delete flow removed the active goal
  - cuotas page rendered, create flow succeeded through HTTP backend, route reload preserved the plan, backend ID verified, delete flow removed the active plan, no autosync loop observed
  - investments page rendered, add-entry flow succeeded through HTTP backend, route reload preserved `AAPL`, backend position ID verified
  - settings page rendered and currency sheet displayed backend-loaded settings state
- Cleanup completed after the browser run:
  - settings restored
  - temporary QA category/account removed
  - temporary migrated feature records removed

## Pending UI/UX QA Closure Against Backend

- Ran headless Chromium against Vite frontend and live backend/Postgres stack using the same managed backend/frontend server pattern.
- Run ID: `uiqa-pending-1781208043121`
- Passed pending browser checks:
  - budgets page render, empty state, create flow, browser refresh persistence, detail edit flow, backend-generated ID/update verification; delete behavior verified by backend API deletion followed by browser reload because budget delete is not exposed in current UI
  - goals page render, empty state, create flow, browser refresh persistence, detail edit flow, delete dialog flow using `Eliminar entradas`, and removal after reload
  - cuotas page render, empty state, create flow, browser refresh persistence, paid-state future-date guard (`0/3` remained stable with `Fecha inválida`), no extra installment item calls on blocked paid-state click, and delete confirmation flow
  - investments page render, empty state, add position/entry flow, route reload persistence, provider refresh request path exercised/stable, detail entries displayed, add-entry flow, delete-entry action, delete-position confirmation, and backend removal verification
  - settings page render, profile update, currency update, theme update applied to `document.documentElement.dataset.theme`, notifications toggle, PIN activation, PIN deactivation; reset UI is not exposed, while backend reset was covered by API QA and settings restoration was verified during cleanup
  - error states for `/budgets`, `/goals`, `/plans`, `/investments`, and `/settings` using controlled failed API responses
  - primary migrated pages loaded on mobile `390x844` and desktop `1280x900` viewports without horizontal overflow
- Cleanup completed after the pending QA run:
  - settings restored
  - temporary QA category/account removed
  - temporary migrated feature records removed
- No new frontend or backend regressions were found during pending UI/UX QA closure.

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

- Live backend API QA is complete for migrated feature-domain runtime flows.
- Live browser/UI QA is complete for migrated feature-domain flows that are currently exposed in the UI.
- No blocking manual QA gaps remain for archival.
- Non-blocking UI affordance notes:
  - budget delete is not exposed in the current UI; backend API delete plus browser reload removal was verified.
  - installment/cuota edit is not exposed in the current UI; create, paid-state guard, delete, and backend API update behavior were verified.
  - investment direct position edit is not exposed as a separate UI affordance; add/delete position, add/delete entry, snapshots/refs/provider refresh request stability, and backend API update behavior were verified.
  - settings reset is not exposed in the current UI; backend reset and UI update/restore flows were verified.
  - live provider quote value depends on provider/API-key environment; UI attempted the market quote path and remained stable.

## Rollback Notes

- Roll back by reverting the stabilization commits/files only.
- No localStorage-to-backend data merge was introduced.
- No auth, sessions, authorization, or user ownership semantics were introduced.
