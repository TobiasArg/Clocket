## Context

Clocket already moved the core finance domains (`accounts`, `categories`, `transactions`) toward backend-owned persistence with Next.js Pages API routes, TypeScript service boundaries, Prisma/PostgreSQL repositories, and frontend HTTP repository implementations. The remaining product domains (`budgets`, `goals`, `cuotas`/installments, `investments`, and `app-settings`) still expose frontend repository interfaces backed by browser `localStorage`, while several matching backend repositories and Prisma models already exist.

This change defines the next migration phase: keep the existing Next.js API Route architecture, add missing feature-domain service/API boundaries, and cut over frontend repository bindings without redesigning UI flows or introducing auth.

## Goals / Non-Goals

**Goals:**

- Provide backend API/service contracts for budgets, goals, cuotas/installments, investments, market snapshots/refs, and app settings.
- Reuse existing Prisma/PostgreSQL repository direction and existing frontend domain repository interfaces where practical.
- Add frontend HTTP repositories and switch active bindings away from feature-domain `localStorage` repositories.
- Preserve clean-start semantics for feature-domain data and backend-generated IDs.
- Validate the migration with backend API/service tests, frontend repository/hook tests, and build checks.

**Non-Goals:**

- No authentication, authorization, sessions, user ownership, or multi-tenant access control.
- No localStorage import/mapping for legacy feature-domain records.
- No NestJS migration; Next.js API Routes remain the implementation target.
- No UI redesign or product behavior expansion beyond what is required for backend cutover.
- No new market data provider or provider-side caching redesign beyond persisting snapshots/refs already represented by the domain model.

## Decisions

1. **Keep Next.js API Routes for feature domains.**
   - Decision: implement `backend/pages/api/**` route handlers that delegate to TypeScript contracts/services/repositories, matching the core-finance pattern.
   - Rationale: this is the existing repo direction and avoids framework churn while auth is still pending.
   - Alternative considered: migrate to NestJS now. Rejected because current complexity can be handled by typed service boundaries and tests.

2. **Use Prisma/PostgreSQL as canonical persistence.**
   - Decision: backend-generated IDs, Prisma Decimal values, normalized foreign keys, timestamps, and soft-delete conventions remain canonical.
   - Rationale: aligns with archived persistence specs and avoids preserving localStorage-specific shapes internally.
   - Alternative considered: keep localStorage as a fallback source. Rejected for active runtime because it would duplicate source-of-truth rules.

3. **Preserve frontend repository interfaces where practical.**
   - Decision: HTTP repositories adapt API payloads to existing domain types used by hooks/page models.
   - Rationale: limits UI churn and keeps the change focused on persistence/API migration.
   - Alternative considered: rewrite hooks around route-specific API clients. Rejected because it would mix migration with UI/state architecture changes.

4. **Runtime validation belongs at API boundaries.**
   - Decision: validate request method, path/query params, body shape, enum values, numeric/decimal constraints, dates/month keys, and relationship references before calling services.
   - Rationale: feature domains have cross-domain relationships and money/date inputs that must fail predictably.
   - Alternative considered: rely only on TypeScript and Prisma errors. Rejected because runtime API payloads need controlled 4xx/5xx responses.

5. **Structured API errors and logs should match existing backend helpers.**
   - Decision: reuse shared HTTP/error helpers and add lightweight diagnostic logging for unexpected provider/persistence failures without logging secrets or full financial payload dumps.
   - Rationale: consistent frontend error handling and safer debugging.
   - Alternative considered: domain-specific response formats. Rejected because it would increase frontend adapters and test matrix.

6. **Cache/rate-limit remains scoped to market quote/provider paths.**
   - Decision: feature-domain CRUD APIs do not add cache or rate-limit dependencies; investment market snapshot/ref persistence can reuse existing market quote behavior and provider constraints.
   - Rationale: avoids premature infrastructure before auth and deployment constraints are finalized.
   - Alternative considered: add a generic API cache/rate limiter now. Rejected as unrelated to localStorage cutover.

## Risks / Trade-offs

- **Clean-start data loss for local browser feature records** → Mitigate by documenting localStorage keys affected and keeping rollback instructions that restore localStorage bindings from git rather than attempting data merge.
- **Cross-domain references may break if core finance data is absent** → Mitigate with 400/404 validation for missing category, subcategory, account, transaction, or investment references and frontend empty/error states.
- **Investment contracts are broader than simple CRUD** → Mitigate by implementing entries, positions, snapshots, and refs in staged tasks with focused repository/API tests.
- **Settings include sensitive-looking security fields such as `pinHash`** → Mitigate by treating auth/security as out of scope, avoiding secret exposure in logs, and preserving only the existing settings contract until auth ownership is designed.
- **Statistics may depend on migrated domains indirectly** → Mitigate by keeping statistics as a consumer of repository/domain data, not a separate persistence migration in this change.

## Migration Plan

1. Confirm backend repository coverage and add missing services/contracts/API handlers for budgets, goals, installments, investments, market refs/snapshots, and settings.
2. Add backend API route files and tests for happy paths, validation failures, not-found cases, and method handling.
3. Add frontend HTTP repositories and tests that assert domain repository interface compatibility and payload mapping.
4. Switch active exports/bindings domain by domain from localStorage to HTTP repositories.
5. Add/extend clean-start utilities for feature-domain localStorage keys.
6. Run backend tests/build, frontend tests/build, and strict OpenSpec validation.

Rollback strategy: revert the repository-binding commits to restore localStorage-backed repositories. Backend routes/services can remain dormant if frontend bindings are reverted.

## Open Questions

- Should settings `security.pinHash` be persisted before auth/user ownership, or should security fields be excluded from backend settings until the auth change lands?
- Should installment plan APIs own generated transaction side effects immediately, or initially expose plans only and preserve transaction generation in frontend hooks?
- Should investment snapshot/ref APIs be exposed under `/api/investments/**` or share market quote route namespaces for provider-derived prices?
