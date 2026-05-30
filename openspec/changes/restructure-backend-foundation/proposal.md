## Why

Clocket's backend is currently a small Next.js API Route proxy for Alpha Vantage, while most persistence, migrations, and financial business rules live in frontend `localStorage` repositories. This change establishes the first safe backend foundation from `BACKEND_RESTRUCTURE_AUDIT.md`: freeze the existing market quote contract, add testable service boundaries, and document the selected long-term backend stack before moving domain data out of the frontend.

## What Changes

- Formalize the backend foundation around Next.js API Routes first, with TypeScript-ready service/module boundaries instead of route-coupled provider logic.
- Define a canonical `GET /api/market/quote` success and error contract, including normalized error fields expected by the frontend.
- Add backend validation and tests for the current Alpha Vantage integration before larger restructuring.
- Use `ALPHA_VANTAGE_TIMEOUT_MS` as the documented timeout source instead of a hardcoded-only timeout.
- Document Prisma ORM and PostgreSQL as the selected persistence direction for later financial-domain migration.
- Document NestJS as an optional escalation path only if backend domain complexity exceeds what Next.js API Routes plus extracted services can maintain.
- Document missing supporting technologies that should be considered before production persistence: runtime schema validation, test runner, API documentation, env validation, structured logging, and a durable cache/rate-limit store.
- Non-goal: implement authentication in this change.
- Non-goal: implement PostgreSQL/Prisma schema or migrate frontend `localStorage` repositories in this first foundation change.

## Capabilities

### New Capabilities

- `backend-foundation`: Backend structure, validation gates, environment handling, and service boundaries required before domain migration.
- `market-quotes-api`: Canonical behavior and contract for `GET /api/market/quote` and the Alpha Vantage provider adapter.
- `backend-persistence-roadmap`: Persistence architecture decisions for future Prisma/PostgreSQL domain migration without implementing auth yet.

### Modified Capabilities

- None. No existing OpenSpec capabilities are present in `openspec/specs/`.

## Impact

- Affected backend code: `backend/pages/api/market/quote.*`, `backend/lib/alphaVantageClient.*`, future `backend/src/**`, backend scripts and tests.
- Affected frontend contract: `frontend/src/data/http/marketQuoteApiClient.ts` remains the consumer of `/api/market/quote`; the backend must preserve or improve the fields it relies on.
- Affected docs/specs: OpenSpec artifacts under `openspec/changes/restructure-backend-foundation/` and audit traceability from `BACKEND_RESTRUCTURE_AUDIT.md`.
- Dependencies may be added in backend only for TypeScript/test/runtime validation if needed; Prisma/PostgreSQL are documented for a later phase unless explicitly started by a later change.
