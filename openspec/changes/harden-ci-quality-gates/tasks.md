## 1. Frontend CI

- [x] 1.1 Add or update workflow steps for `npm --prefix frontend test`.
- [x] 1.2 Add `npm --prefix frontend run typecheck` and `npm --prefix frontend run lint`.
- [x] 1.3 Keep `npm --prefix frontend run build:ci` as bundle/build gate.

## 2. Backend CI

- [x] 2.1 Add workflow steps for `npm --prefix backend test`.
- [x] 2.2 Add `npm --prefix backend run typecheck`, `npm --prefix backend run prisma:validate`, and `npm --prefix backend run build`.

## 3. OpenSpec and DB Smoke

- [x] 3.1 Add strict OpenSpec validation for active changes and canonical specs.
- [x] 3.2 Add PostgreSQL service smoke validation using `RUN_DB_TESTS=1`.
- [x] 3.3 Document any workflow path filters and why they are safe.

## 4. Validation

- [x] 4.1 Validate workflow syntax locally where possible.
- [x] 4.2 Run frontend/backend validation commands locally before opening PR.
- [x] 4.3 Run `openspec validate harden-ci-quality-gates --strict --no-interactive`.
