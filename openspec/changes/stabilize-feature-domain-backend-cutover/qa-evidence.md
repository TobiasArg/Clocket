## QA Evidence

Date: 2026-06-07

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
- Validation command:
  - `npm --prefix frontend test` — passed, 20 files / 77 tests passed
  - `npm --prefix frontend run typecheck` — passed
  - `npm --prefix frontend run lint` — passed
  - `npm --prefix frontend run build` — passed

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

## Known Gaps / Pending Manual QA

- Live API smoke testing against Postgres was not completed because Docker daemon was unavailable:
  - Attempted: `docker compose up -d postgres && npm --prefix . run prisma:migrate:dev -- --name agent-validation --skip-generate`
  - Result: `Cannot connect to the Docker daemon at unix:///Users/argtobias/.docker/run/docker.sock. Is the docker daemon running?`
- Browser-based Playwright QA was not completed because Python Playwright is not installed in the current environment.
- Pending manual verification remains required for full archival:
  - budgets, goals, cuotas, investments, and settings end-to-end UI CRUD flows
  - browser refresh persistence against a live backend database
  - desktop/mobile visual pass
  - live provider behavior for market quote refresh, if API key is available

## Rollback Notes

- Roll back by reverting the stabilization commits/files only.
- No localStorage-to-backend data merge was introduced.
- No auth, sessions, authorization, or user ownership semantics were introduced.
