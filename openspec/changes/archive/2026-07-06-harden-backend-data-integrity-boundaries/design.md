## Context

The backend now owns financial domains, but several integrity constraints are still implemented only in application code or not fully enforced. This change hardens single-profile backend integrity without mixing in auth/user ownership.

## Goals / Non-Goals

**Goals:**

- Ensure destructive actions do not leave active orphaned or ambiguous financial records.
- Make installment mark-paid/reconcile behavior idempotent.
- Ensure GET/read endpoints do not mutate state.
- Convert predictable bad input into controlled 4xx responses.

**Non-Goals:**

- No auth, sessions, `userId`, or ownership migration.
- No shared-ledger support.
- No import/restore behavior.

## Decisions

1. **Prefer service-level invariants plus DB constraints.** Application validation gives product-specific errors; DB constraints protect concurrency and race conditions.
2. **Resolution flows must be mandatory for linked data.** Direct destructive endpoints should reject or resolve linked records instead of silently leaving inconsistent state.
3. **Read endpoints are side-effect free.** Asset/ref creation belongs to POST/PUT or explicit refresh actions, not GET.
4. **Errors remain calm and structured.** Predictable invalid requests return `{ error, code, status, retryable }` style responses.

## Risks / Trade-offs

- Adding constraints may require data cleanup before migration → include migration checks.
- Tightening validation can reject previously accepted data → communicate expected formats in UI/API tests.
- Idempotency under concurrency may require Prisma transaction changes and unique indexes.

## Migration Plan

1. Add tests for current integrity failures.
2. Add service-level guards and controlled errors.
3. Add DB constraints/indexes where needed.
4. Run backend unit tests and DB smoke before archive.
