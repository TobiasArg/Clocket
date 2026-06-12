## Context

The export utility has already been stabilized to use HTTP-backed repositories. The next step is hardening the contract so exported files are self-describing and cannot silently look complete when required sections fail.

## Goals / Non-Goals

**Goals:**

- Define a versioned export snapshot contract.
- Include manifest, counts, exportedAt, and integrity metadata.
- Ensure migrated data comes from backend/API-backed sources.
- Keep CSV transaction export separate from full backup semantics.

**Non-Goals:**

- No import/restore flow.
- No auth/user ownership.
- No encrypted backup or account-scoped export.

## Decisions

1. **Full JSON export is self-describing.** Version, manifest, counts, and checksum/digest are required.
2. **Backend-canonical sources only.** Legacy localStorage records must not be included or merged.
3. **Partial failures are controlled.** Required domain read failures fail the export or mark it incomplete explicitly.
4. **CSV is transaction-only.** CSV remains convenience export, not full backup.

## Risks / Trade-offs

- Checksum generation requires stable serialization.
- A backend endpoint can wait; the first implementation may harden the frontend builder if it only reads backend sources.
- Import semantics must not be implied by export hardening.

## Migration Plan

1. Define export contract and tests.
2. Add manifest/count/checksum generation.
3. Verify backend/API-backed source usage.
4. Validate exports and CSV separation.
