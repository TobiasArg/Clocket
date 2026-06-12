## Why

Settings export and CSV generation are browser-composed from HTTP repositories. After backend cutover, exports should be treated as backend-canonical snapshots with explicit versioning, completeness rules, and integrity metadata. Import remains out of scope until separately specified.

## What Changes

- Define a hardened, versioned full JSON export contract for backend-canonical backup snapshots.
- Add manifest, exported timestamp, per-domain counts, and checksum/integrity metadata requirements.
- Ensure full export data comes from backend/API-backed sources, not legacy localStorage repositories.
- Keep transaction CSV export compatible but explicitly scoped separately from full JSON backup.
- Non-goal: import/restore, localStorage import, auth, user ownership, encrypted backups, or cross-user export scoping.

## Capabilities

### New Capabilities

- `settings-export-contract-hardening`: Versioned backend-canonical export contract and validation boundaries.

### Modified Capabilities

- None.

## Impact

- Frontend: `frontend/src/utils/settingsExport.ts`, export tests, HTTP repository source tests.
- Backend: only affected if implementation chooses a backend export endpoint.
- Validation: frontend tests/build, backend tests/build if applicable, and OpenSpec validation.
