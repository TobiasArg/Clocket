## Context

The previous migration moved feature-domain runtime bindings away from `localStorage` and toward backend APIs for budgets, goals, installment plans/cuotas, investments, market snapshots/refs, and app settings. The migration passed automated tests and builds, but the next risk is runtime correctness: mismatched payload shapes, stale frontend assumptions, UI actions that still depend on local behavior, and edge cases around empty/error/loading states.

This change defines a stabilization phase. It is intentionally not an auth phase and not a feature expansion phase.

## Goals / Non-Goals

**Goals:**

- Confirm migrated backend APIs persist, read, update, delete, and clear data correctly.
- Confirm frontend repositories map backend payloads to existing domain/UI shapes correctly.
- Confirm hooks/page models and UI controls still work after repository cutover.
- Confirm backend data remains after page refresh and localStorage legacy records are ignored or cleared.
- Add focused tests for regressions discovered during QA.
- Produce manual QA evidence for migrated flows.

**Non-Goals:**

- No auth or user ownership.
- No new UI flows or redesigns.
- No localStorage data import.
- No schema redesign unless required to fix a blocking migrated-flow bug.
- No opportunistic refactor outside affected flows.

## Decisions

1. **Backend remains canonical.**
   - Decision: migrated domains must read/write through backend APIs and Prisma-backed repositories.
   - Rationale: the previous cutover intentionally made backend persistence the source of truth.

2. **Stabilization fixes must be minimal.**
   - Decision: fixes should target observed regressions, mapping issues, validation gaps, and interaction breakages.
   - Rationale: this phase should reduce risk, not introduce new architecture.

3. **Manual QA is required in addition to automated tests.**
   - Decision: run user-flow checks for migrated pages and controls, including refresh/persistence behavior.
   - Rationale: UI regressions such as broken buttons, incorrect empty states, or stale loading state may not be covered by unit tests.

4. **No auth assumptions.**
   - Decision: APIs continue to operate as single-ledger/single-profile until a future explicitly scoped auth change.
   - Rationale: introducing auth concepts now would mix stabilization with a separate product/security milestone.

5. **Clean-start behavior is verified, not changed into data migration.**
   - Decision: legacy localStorage keys may be cleared or ignored, but records are not imported or remapped.
   - Rationale: the migration contract chose clean-start semantics.

6. **Error UX remains calm and actionable.**
   - Decision: visible errors should be neutral, understandable, and not crash the app.
   - Rationale: aligns with Clocket product principles around low cognitive stress.

## Risks / Trade-offs

- **Payload mismatches**: backend decimals/timestamps/null references may not map perfectly to frontend domain shapes.
- **Reference mismatches**: category/subcategory IDs and names can diverge if mapping is incomplete.
- **Cuota side effects**: generated transaction behavior may require focused verification.
- **Investment complexity**: positions, entries, snapshots, refs, and market refresh interactions can regress independently.
- **Settings cache/theme behavior**: settings persistence may work while UI theme/currency cache remains stale.
- **Manual QA time**: a thorough pass is slower than automated validation but necessary after a broad persistence cutover.

## Stabilization Plan

1. Run backend API smoke checks and inspect payloads for migrated domains.
2. Run frontend flows in the browser for migrated pages and related navigation.
3. Record any regression as a concrete fix task tied to one domain/flow.
4. Fix smallest coherent units and add focused tests where behavior is non-trivial.
5. Re-run backend/frontend tests/builds and strict OpenSpec validation.
6. Document manual QA evidence and known gaps before archival.

Rollback strategy: revert the affected stabilization fix commit(s). If a frontend binding regression is discovered that cannot be fixed quickly, temporarily reverting the specific repository binding remains the fallback, without attempting backend-to-localStorage data merge.
