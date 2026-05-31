## 1. OpenSpec Persistence Design

- [x] 1.1 Create `design-backend-persistence-schema` OpenSpec change.
- [x] 1.2 Add proposal, design, and specs for Prisma/PostgreSQL persistence without auth.
- [x] 1.3 Validate the OpenSpec change with `openspec validate design-backend-persistence-schema --strict --no-interactive`.
- [x] 1.4 Commit the validated persistence schema spec.

## 2. Deferred Implementation Stage

- [ ] 2.1 Add Prisma dependencies and scripts in `backend/package.json`.
- [ ] 2.2 Add `backend/prisma/schema.prisma` matching this spec.
- [ ] 2.3 Add PostgreSQL local development/test orchestration and `.env.example` DB variables.
- [ ] 2.4 Add Prisma client initialization under `backend/src/persistence`.
- [ ] 2.5 Add DB smoke tests for connection, Decimal round-trip, and migration state.

## 3. Deferred Core Domain Stage

- [ ] 3.1 Implement accounts repository and tests.
- [ ] 3.2 Implement categories/subcategories repository and tests.
- [ ] 3.3 Implement transactions repository and tests.
- [ ] 3.4 Add localStorage import dry-run mapping for core entities.

## 4. Deferred Feature Domain Stage

- [ ] 4.1 Implement budgets persistence and overlap validation tests.
- [ ] 4.2 Implement goals persistence and category synchronization tests.
- [ ] 4.3 Implement installment plan persistence and generated transaction tests.
- [ ] 4.4 Implement investment persistence, snapshots, and asset refs tests.

## 5. Explicitly Out of Scope for This Change

- [x] 5.1 Do not implement authentication or user/session tables in this spec change.
- [x] 5.2 Do not migrate frontend localStorage repositories in this spec change.
