## Context

The backend cutovers intentionally kept localStorage repositories around during migration and testing. After stabilization, those repositories should no longer be reachable through active production bindings except clean-start utilities.

## Goals / Non-Goals

**Goals:**

- Remove migrated localStorage repositories from active runtime exports.
- Preserve clean-start behavior for legacy keys.
- Add tests preventing accidental localStorage reintroduction.

**Non-Goals:**

- No data import or legacy ID preservation.
- No auth/user ownership.
- No removal of clean-start safeguards.

## Decisions

1. **Quarantine before deletion.** Legacy repositories may be retained in explicit test/legacy paths before deletion.
2. **Clean-start utilities remain active.** Runtime may import key detection/reset utilities only.
3. **Public barrels stop exporting legacy persistence.** Active app exports should resolve to HTTP-backed repositories.
4. **Tests enforce runtime boundaries.** Add coverage for active defaults and settings export sources.

## Risks / Trade-offs

- Some tests may depend on legacy classes and need explicit legacy-only imports.
- Deleting too aggressively could make rollback harder; quarantine is safer first.

## Migration Plan

1. Inventory imports/exports and classify artifacts.
2. Remove legacy repositories from active barrels and runtime imports.
3. Preserve clean-start tests and add forbidden-runtime-regression coverage.
4. Validate frontend tests/build and OpenSpec.
