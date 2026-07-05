## Why

The audit found OpenSpec governance drift: the implementation order still marks an archived settings export change as pending, project context describes localStorage as dominant, and several canonical specs have placeholder purposes. Accurate roadmap state is necessary before starting the next implementation wave.

## What Changes

- Update OpenSpec project context and implementation order to match the backend-owned/HTTP-repository state.
- Fill placeholder purposes in canonical specs.
- Add a spec-to-test/manual-QA traceability matrix for future maintenance.
- Preserve `add-auth-user-ownership` as future-gated and untouched.
- Non-goal: implementing auth, changing runtime code, or archiving `add-auth-user-ownership`.

## Capabilities

### New Capabilities

- `openspec-roadmap-state`: Requirements for accurate OpenSpec roadmap, canonical context, and traceability metadata.

### Modified Capabilities

- None.

## Impact

- OpenSpec documentation only: `openspec/config.yaml`, `openspec/changes/IMPLEMENTATION_ORDER.md`, canonical spec metadata, optional traceability document.
- Validation: OpenSpec strict changes/specs validation.
