## 1. Legacy Repository Inventory

- [ ] 1.1 Inventory all `frontend/src/data/localStorage/**` repositories, exports, tests, and production import sites.
- [ ] 1.2 Classify each legacy artifact as `retire`, `quarantine`, or `clean-start-required`.
- [ ] 1.3 Document legacy keys retained only for clean-start cleanup.

## 2. Export and Runtime Cutover

- [ ] 2.1 Remove migrated localStorage repository classes and instances from public/shared frontend barrels.
- [ ] 2.2 Keep clean-start utilities exported through the minimal path needed by active runtime.
- [ ] 2.3 Replace any remaining production imports of migrated localStorage repositories with HTTP/domain contracts.
- [ ] 2.4 Ensure test fixtures that still need legacy repositories import them from explicit legacy-only paths.

## 3. Regression Tests

- [ ] 3.1 Add tests proving active repository defaults resolve to HTTP implementations.
- [ ] 3.2 Add tests proving settings export and feature flows do not call localStorage repositories.
- [ ] 3.3 Preserve clean-start tests for migrated legacy keys.
- [ ] 3.4 Add static/import-boundary coverage if the project has an existing lint/test pattern for forbidden imports.

## 4. Validation

- [ ] 4.1 Run `npm --prefix frontend test`.
- [ ] 4.2 Run `npm --prefix frontend run build`.
- [ ] 4.3 Run `openspec validate frontend-localstorage-repository-retirement --strict --no-interactive`.
- [ ] 4.4 Confirm localStorage import/merge, legacy ID preservation, auth, sessions, authorization, and user ownership remain out of scope.
