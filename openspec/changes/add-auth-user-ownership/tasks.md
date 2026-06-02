## 1. Product and Architecture Decisions

- [ ] 1.1 Confirm product requirements for sign-up, login, logout, account recovery, session lifetime, and whether accounts are personal-only or shared-ledger capable.
- [ ] 1.2 Select the auth/session implementation approach and document provider-specific trade-offs before writing code.
- [ ] 1.3 Define the public API auth error policy for `401`, `403`, and `404` on private resources.

## 2. Prisma Ownership Schema

- [ ] 2.1 Add `User` and required auth/session/provider models or managed-auth mapping tables.
- [ ] 2.2 Add required `userId` ownership relations to user-private finance tables: accounts, categories, subcategories, transactions, budgets, budget scopes, goals, installment plans, investment positions, investment entries, and settings.
- [ ] 2.3 Keep shared market/reference tables unowned only if they contain no private user state.
- [ ] 2.4 Update unique constraints and indexes to include ownership where needed, including investment positions per user/asset and settings per user.
- [ ] 2.5 Define and implement an environment-specific backfill policy for existing unowned rows.
- [ ] 2.6 Validate Prisma schema generation and migration SQL before applying to shared environments.

## 3. Backend Auth and Authorization

- [ ] 3.1 Add a backend auth adapter that resolves a normalized authenticated user context from Next.js API requests.
- [ ] 3.2 Require authenticated context for every private finance API route.
- [ ] 3.3 Refactor services/repositories so every user-owned query and mutation receives trusted `userId` context.
- [ ] 3.4 Scope all user-owned repository reads, updates, deletes, aggregates, and related-record validations by `userId`.
- [ ] 3.5 Ensure writes that reference multiple entities verify all referenced rows belong to the same authenticated user inside the transaction.

## 4. Frontend Session Boundary

- [ ] 4.1 Add frontend session bootstrap and authenticated/unauthenticated route behavior based on product requirements.
- [ ] 4.2 Update HTTP repositories to send credentials/tokens according to the chosen auth approach.
- [ ] 4.3 Define logout behavior and local client-state clearing for private financial data.
- [ ] 4.4 Communicate clean-start behavior for existing localStorage data unless a separate import change supersedes it.

## 5. Tests and Validation

- [ ] 5.1 Add migration tests or SQL review evidence for ownership columns, backfill behavior, and scoped unique constraints.
- [ ] 5.2 Add repository tests proving user A cannot list, read, update, delete, aggregate, or link user B's private rows.
- [ ] 5.3 Add API tests for unauthenticated requests, authenticated happy paths, and foreign-resource access returning the selected safe error behavior.
- [ ] 5.4 Add transaction tests for multi-entity writes that reference accounts, categories, goals, installment plans, and investment entries across ownership boundaries.
- [ ] 5.5 Run `npm --prefix backend test`.
- [ ] 5.6 Run `npm --prefix backend run build`.
- [ ] 5.7 Run `npm --prefix frontend test` and `npm --prefix frontend run build` if frontend auth/session code changes.
