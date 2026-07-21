---
name: clocket-financial-integrity
description: Safeguard Clocket financial correctness across Prisma/PostgreSQL persistence, backend API and service changes, and frontend financial-data boundaries. Use when a task creates, updates, deletes, reconciles, aggregates, converts, or displays canonical financial data for accounts, transactions, budgets, goals, installments, investments, analytics, or exchange rates; or changes backend/prisma, backend/src/modules, or frontend domain/HTTP code that affects those flows.
---

# Clocket Financial Integrity

Preserve the financial invariants that the backend owns. Use this skill to
scope a change, read the relevant canonical specification, implement the
smallest safe behavior, and prove it with proportionate validation.

## 1. Classify the change before editing

Choose every applicable surface:

| Surface | Read before changing |
| --- | --- |
| Balances, aggregates, conversion, analytics, or currency display | `openspec/specs/financial-balance-and-currency-correctness/spec.md` |
| Writes, deletes, validation, or API error handling | `openspec/specs/backend-data-integrity-boundaries/spec.md` and `openspec/specs/feature-domain-api-service-boundary/spec.md` |
| Prisma schema, migration, relation, unique constraint, or repository transaction | `backend/prisma/schema.prisma`, the relevant migration history, and `backend/src/persistence/` |
| Installment paid counts, reconciliation, or generated transactions | `openspec/specs/backend-owned-installment-ledger-effects/spec.md` |
| Exchange-rate source, conversion metadata, or fallback handling | `openspec/specs/backend-owned-exchange-rate-boundary/spec.md` |
| Home or Statistics totals, buckets, or frontend mapping | `openspec/specs/backend-owned-financial-analytics-read-models/spec.md` |
| A migrated UI flow | `openspec/specs/manual-qa-validation/spec.md` |

For a new or materially changed behavior, work through the active OpenSpec
change first. Do not treat an archived change as permission to change a
canonical rule.

## 2. Preserve these invariants

- Treat backend persistence and backend read models as the canonical source for
  migrated financial flows. The frontend maps responses and renders them; it
  does not recreate canonical balance, ledger, or analytics rules.
- Include the account opening balance and only eligible transactions in account
  balance calculations. Convert mixed-currency aggregates to one documented
  display basis before summing.
- Use backend-provided exchange-rate state for canonical USD/ARS conversion.
  Preserve stale/default/unavailable metadata; never present a fallback as a
  fresh canonical rate.
- Validate predictable input before persistence and return the established
  controlled HTTP error shape. Do not leak Prisma errors, secrets, or full
  financial payloads.
- Keep GET and other read operations side-effect free. In particular, a missing
  investment reference must not create persistence as a by-product of reading.
- Make ledger-producing and retryable operations idempotent. A repeated
  installment action must not create a duplicate transaction or diverge the
  paid count.
- For a delete or clear operation, explicitly resolve linked active records or
  reject the operation with a controlled client error. Never leave an ambiguous
  reference or orphaned active ledger effect.
- Keep related financial writes atomic when an intermediate state would be
  invalid. Preserve database constraints rather than relying only on UI checks.

## 3. Implement at the correct boundary

1. Put request parsing, method handling, and response serialization in the API
   handler; keep provider-specific details out of domain services.
2. Put validation and financial business rules in the service/domain boundary;
   use repositories for persistence and scoped queries.
3. Change Prisma schema and migrations only when the data invariant requires
   it. Review existing constraints and migration order before proposing a new
   constraint, index, cascade, or destructive data operation.
4. Return canonical backend data after a mutation. Invalidate or refetch the
   affected frontend read model when a value, currency, or rate changes; do not
   rely only on collection-size changes.
5. Preserve existing empty, fallback, and controlled-error UI states when
   adapting a frontend repository or page model.

## 4. Validate proportionately

Run focused tests for every changed behavior, then use this matrix:

| Change | Minimum validation |
| --- | --- |
| Backend service, repository, handler, provider, or financial rule | `npm --prefix backend test`, `npm --prefix backend run typecheck`, `npm --prefix backend run build` |
| Prisma schema, migration, or persistence behavior | The backend checks above, `npm --prefix backend run prisma:validate`, and `npm run db:up && npm run db:migrate && npm --prefix backend run test:db` |
| Frontend mapping, domain rule, hook, or financial screen | `npm --prefix frontend test`, `npm --prefix frontend run typecheck`, and `npm --prefix frontend run build:ci` |
| OpenSpec artifacts | `openspec validate <change-id> --strict --no-interactive`; validate all changes/specs when the task requires it |

For a changed user flow, manually cover the affected create/update, delete or
reset, empty, error, and refresh-persistence states. Record known gaps and
rollback notes with the change evidence.

## 5. Stop and ask for a decision

Do not infer any of the following:

- Authentication, sessions, user ownership, or cross-user authorization. These
  belong to the future `add-auth-user-ownership` change.
- A destructive or irreversible data migration, backfill, or production data
  deletion without an approved migration and rollback plan.
- A new currency pair, rate provider, money scale/rounding policy, or a change
  to what counts as income, expense, savings, or balance when the canonical
  specifications do not decide it.

State the concrete ambiguity, affected data, and the smallest decision needed
before continuing.
