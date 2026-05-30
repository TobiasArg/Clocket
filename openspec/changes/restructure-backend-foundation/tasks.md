## 1. OpenSpec Foundation

- [x] 1.1 Create proposal, design, specs, and tasks for `restructure-backend-foundation` using `BACKEND_RESTRUCTURE_AUDIT.md` as baseline.
- [x] 1.2 Validate the OpenSpec change with `openspec validate restructure-backend-foundation --strict --no-interactive`.
- [ ] 1.3 Commit the validated OpenSpec artifacts as an independent documentation stage.

## 2. Backend Contract and Tooling

- [ ] 2.1 Add backend TypeScript/test tooling and scripts without changing the public endpoint URL.
- [ ] 2.2 Define market quote success and error contracts in backend modules.
- [ ] 2.3 Add backend config parsing for `ALPHA_VANTAGE_API_KEY` and `ALPHA_VANTAGE_TIMEOUT_MS` with a 12000 ms fallback.
- [ ] 2.4 Add tests for request validation, missing API key, provider success, throttling, invalid symbol, parse failure, and transient provider failure.

## 3. Backend Market Quote Refactor

- [ ] 3.1 Extract route-independent Alpha Vantage provider code while preserving retry and throttling safeguards.
- [ ] 3.2 Refactor `pages/api/market/quote` to remain a thin Next.js API adapter.
- [ ] 3.3 Return canonical error payloads including `error`, `code`, `status`, `retryable`, and `stalePolicy`.
- [ ] 3.4 Preserve the existing canonical success payload consumed by the frontend.

## 4. Validation and Commit

- [ ] 4.1 Run `npm --prefix backend test`.
- [ ] 4.2 Run `npm --prefix backend run build`.
- [ ] 4.3 Run `npm --prefix frontend run typecheck` if frontend contract files change.
- [ ] 4.4 Update task checkboxes for completed implementation work.
- [ ] 4.5 Commit the validated backend implementation stage.

## 5. Deferred Follow-up Changes

- [ ] 5.1 Create a later OpenSpec change for Prisma/PostgreSQL schema design.
- [ ] 5.2 Create a later OpenSpec change for account/category/transaction migration from frontend repositories.
- [ ] 5.3 Create a later OpenSpec change for auth/user ownership when product requirements are ready.
