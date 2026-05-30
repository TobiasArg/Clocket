## Context

`BACKEND_RESTRUCTURE_AUDIT.md` identifies that Clocket is still local-first: frontend `localStorage` repositories own accounts, categories, transactions, budgets, goals, cuotas, investments, settings, migrations, cascades, and multiple cross-domain side effects. The backend currently has one productive responsibility: `GET /api/market/quote`, implemented with Next.js Pages API Routes and a JavaScript Alpha Vantage client.

The first backend refactor must reduce risk instead of rewriting everything. The safest path is to keep Next.js API Routes for now, freeze the current market quote behavior with tests, extract route-independent service/provider boundaries, and document the Prisma/PostgreSQL persistence direction for later domain migration.

## Goals / Non-Goals

**Goals:**

- Keep Next.js as the active backend framework for the first phase.
- Make the current market quote endpoint contract explicit and testable.
- Move backend code toward TypeScript-compatible modules and explicit contracts.
- Read and validate `ALPHA_VANTAGE_TIMEOUT_MS` from environment configuration.
- Prepare a module layout that can later host financial domain services and repositories.
- Record Prisma ORM + PostgreSQL as the selected persistence stack for later phases.
- Identify missing supporting technologies needed for a production-quality backend.

**Non-Goals:**

- No authentication or user model in this change.
- No Prisma schema, migrations, or PostgreSQL connection in this first implementation stage.
- No migration of frontend `localStorage` repositories yet.
- No NestJS adoption unless a future OpenSpec change justifies it.
- No destructive removal of current frontend local-first behavior.

## Decisions

### Decision 1: Keep Next.js API Routes for the foundation phase

Use Next.js Pages API Routes as the runtime entrypoint and extract business/provider logic into backend modules.

- Rationale: This keeps deployment/runtime risk low and preserves the existing `/api` proxy contract used by the frontend.
- Alternative considered: Full NestJS migration now. Rejected for phase one because there is only one production backend endpoint and no DB/auth/domain services yet.
- Future escalation: NestJS becomes reasonable if the backend needs dependency injection, guards/interceptors, queue consumers, scheduled jobs, or many cross-domain services that become awkward in plain Next.js routes.

### Decision 2: Use TypeScript-ready service boundaries before DB work

Introduce explicit contracts and route-independent modules before adding persistence.

- Rationale: The audit shows duplicated implicit contracts between frontend and backend. Contract tests are higher priority than DB wiring.
- Alternative considered: Start with Prisma/PostgreSQL immediately. Rejected for this phase because the data model is not yet specified and auth/ownership are intentionally out of scope.

### Decision 3: Select Prisma ORM + PostgreSQL for future persistence

Prisma ORM and PostgreSQL are the selected direction for financial-domain persistence, but are not implemented in this first foundation change.

- Rationale: PostgreSQL supports relational integrity, transactions, constraints, reporting, and future auditability better than browser storage. Prisma provides typed schema/migrations and a pragmatic repository boundary for the current TypeScript direction.
- Alternative considered: SQLite local persistence. Rejected as the primary target because Clocket is expected to move toward multi-device persistence.
- Alternative considered: Supabase directly. Compatible with PostgreSQL, but the core decision here is PostgreSQL as the database; hosting/provider can be decided later.

### Decision 4: Add runtime validation before broad API expansion

Use a runtime schema library when adding/validating contracts, preferably Zod unless a later decision selects another library.

- Rationale: TypeScript does not validate runtime HTTP query/body/provider payloads. Market quotes and later financial mutations need explicit validation.
- Alternative considered: Manual validation only. Acceptable for tiny handlers, but not enough once request bodies and DB entities arrive.

### Decision 5: Testing is a required backend gate

Backend work must add scripts for test/typecheck and cover provider + route behavior.

- Rationale: The audit calls out no backend tests. Contract freeze is incomplete without executable checks.
- Preferred stack: Vitest for consistency with the frontend unless Next.js handler testing requires a small helper.

### Decision 6: Document but do not yet add durable cache/rate limiting

Keep the current in-memory provider pacing for the first implementation, but design the contract so cache/rate-limit metadata can be added later.

- Rationale: Alpha Vantage throttling is a known risk, but adding Redis or a persistent quote cache before DB decisions would widen scope.
- Future technology likely needed: Redis or a managed cache/rate-limit service for provider throttling, cache hits, cooldowns, and multi-instance coordination.

## Missing technology assessment

Given the selected stack of Next.js, optional NestJS later, Prisma ORM, and PostgreSQL, the important missing supporting technologies are:

- Runtime schema validation: Zod or equivalent for API inputs, provider payloads, and future mutation bodies.
- Backend test runner: Vitest or Jest; Vitest is recommended for repo consistency.
- API documentation/contract publishing: OpenAPI generation or a schema-to-OpenAPI workflow once endpoints expand beyond market quotes.
- Environment validation: a typed env loader/validator so required secrets and numeric settings fail fast.
- Structured logging: pino or a platform logger wrapper that redacts secrets and includes request/provider context.
- Durable cache/rate limiting: Redis or provider-managed cache later, especially for Alpha Vantage quotas and future multi-instance deployments.
- Local DB orchestration: Docker Compose or equivalent for PostgreSQL dev/test once Prisma is implemented.
- Background jobs/scheduler: only later if quote refresh, import/export, recurring cuota sync, or analytics precomputation move server-side.

## Risks / Trade-offs

- [Risk] Keeping Next.js API Routes could become limiting as domain services grow. → Mitigation: keep route handlers thin and isolate services so NestJS migration remains possible.
- [Risk] Documenting Prisma/PostgreSQL without implementation may defer data-model decisions. → Mitigation: create a later OpenSpec change for the Prisma schema after contract tests are in place.
- [Risk] Market quote error shape changes can break frontend stale snapshot behavior. → Mitigation: include `status`, `code`, `retryable`, and `stalePolicy` in backend errors and cover with tests.
- [Risk] Alpha Vantage quota behavior differs in production. → Mitigation: preserve provider throttling handling and document durable cache/rate-limit as a future requirement.

## Migration Plan

1. Create OpenSpec artifacts and validate them.
2. Add backend TypeScript/test tooling and keep Next.js build passing.
3. Extract market quote contract/config/provider/service code without changing the endpoint URL.
4. Add tests for endpoint validation, provider success, provider throttling, invalid symbols, missing API key, and timeout config.
5. Commit the validated foundation stage.
6. Create later OpenSpec changes for Prisma/PostgreSQL schema and domain-by-domain migration.

Rollback is simple for this phase: revert the backend foundation commit(s). No database migrations or persistent data changes are introduced.

## Open Questions

- Should quote cache TTLs differ by asset type in the first DB-backed implementation?
- Should market quote contracts be shared by importing backend types into frontend, generated from OpenAPI, or copied via a future shared package?
- Will future PostgreSQL be self-hosted, managed Postgres, or Supabase?
- Which financial actions require audit logs once auth is introduced?
