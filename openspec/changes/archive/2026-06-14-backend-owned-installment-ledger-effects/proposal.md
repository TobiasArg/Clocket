## Why

Installment/cuota plans are backend-persisted, but ledger effects still depend on frontend orchestration and legacy localStorage rules. The browser derives paid status by date, blocks future installment payments, and can update paid counts without a backend-owned generated transaction reconciliation boundary.

Generated installment transactions are financial ledger effects. They need idempotent, transactional backend behavior before Clocket can rely on backend persistence across reloads, tabs, or future devices. Authentication and user ownership remain explicitly out of scope.

## What Changes

- Add backend-owned installment ledger effect orchestration for paid-count transitions and elapsed-installment reconciliation.
- Centralize due-date calculation, future-date guard, generated transaction creation/reconciliation, and idempotency in backend services.
- Add explicit backend API operations for marking installments paid and reconciling due installments.
- Cut over frontend plans flows so canonical paid-count/ledger effects are requested from backend rather than derived locally.
- Preserve existing UI behavior for active/finished states, future-date feedback, loading, empty, and error states.
- Non-goal: auth, sessions, authorization, `userId`, shared ledgers, localStorage import, legacy ID preservation, or broad transaction classification redesign.

## Capabilities

### New Capabilities

- `backend-owned-installment-ledger-effects`: Backend-owned paid-count transitions and generated transaction effects for installment plans.

### Modified Capabilities

- None. Existing feature-domain runtime stability and frontend regression specs remain applicable.

## Impact

- Backend: `backend/src/modules/installments/**`, `backend/src/modules/transactions/**`, installment API routes, backend tests, and possibly Prisma indexes if idempotency requires schema support.
- Frontend: `frontend/src/hooks/usePlansPageModel.ts`, `frontend/src/data/http/cuotasRepository.ts`, cuota domain tests.
- Validation: backend tests/build, frontend tests/build, strict OpenSpec validation, and manual QA for due/future/retry flows.
