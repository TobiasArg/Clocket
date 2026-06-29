## 1. Legacy Repository Inventory

- [x] 1.1 Inventory all `frontend/src/data/localStorage/**` repositories, exports, tests, and production import sites.
- [x] 1.2 Classify each legacy artifact as `retire`, `quarantine`, or `clean-start-required`.
- [x] 1.3 Document legacy keys retained only for clean-start cleanup.

## 2. Export and Runtime Cutover

- [x] 2.1 Remove migrated localStorage repository classes and instances from public/shared frontend barrels.
- [x] 2.2 Keep clean-start utilities exported through the minimal path needed by active runtime.
- [x] 2.3 Replace any remaining production imports of migrated localStorage repositories with HTTP/domain contracts.
- [x] 2.4 Ensure test fixtures that still need legacy repositories import them from explicit legacy-only paths.

## 3. Regression Tests

- [x] 3.1 Add tests proving active repository defaults resolve to HTTP implementations.
- [x] 3.2 Add tests proving settings export and feature flows do not call localStorage repositories.
- [x] 3.3 Preserve clean-start tests for migrated legacy keys.
- [x] 3.4 Add static/import-boundary coverage if the project has an existing lint/test pattern for forbidden imports.

## 4. Validation

- [x] 4.1 Run `npm --prefix frontend test`.
- [x] 4.2 Run `npm --prefix frontend run build`.
- [x] 4.3 Run `openspec validate frontend-localstorage-repository-retirement --strict --no-interactive`.
- [x] 4.4 Confirm localStorage import/merge, legacy ID preservation, auth, sessions, authorization, and user ownership remain out of scope.
