## Why

Active frontend bindings now use HTTP repositories for backend-owned domains, but `frontend/src/data/localStorage/**` still exposes historical repository implementations and business rules. Keeping them broadly available increases the risk of accidentally reintroducing client-owned persistence after the backend cutover.

## What Changes

- Retire or quarantine legacy localStorage repositories from active/public frontend exports.
- Preserve clean-start utilities required to ignore or clear migrated legacy keys.
- Keep targeted legacy tests only where they protect clean-start, rollback, or explicit legacy boundaries.
- Prevent production/runtime code from importing legacy persistence repositories.
- Non-goal: localStorage-to-backend import, data merge, legacy ID preservation, auth, sessions, authorization, or user ownership.

## Capabilities

### New Capabilities

- `frontend-localstorage-repository-retirement`: Explicit retirement/quarantine of migrated localStorage repositories after backend cutover.

### Modified Capabilities

- None.

## Impact

- Frontend: `frontend/src/data/localStorage/**`, `frontend/src/utils/index.ts`, repository exports/tests, clean-start tests.
- Validation: frontend tests/build and OpenSpec validation.
