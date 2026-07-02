## Why

Settings export is now versioned and complete, but the audit found that `security.pinHash` can be returned by settings APIs and included in backup data. A four-digit PIN hash is sensitive and should not be exposed or exported as ordinary settings data.

## What Changes

- Redact PIN hashes from settings API responses and full JSON exports.
- Replace client-facing security details with safe metadata such as `hasPin`.
- Keep PIN verification/enforcement expectations explicit and limited to current UI scope until backend auth is activated.
- Improve export failure messaging so the failed domain is actionable.
- Non-goal: auth, sessions, user ownership, encrypted backups, password login, or a new secrets manager.

## Capabilities

### New Capabilities

- `settings-security-export-redaction`: Safe settings security metadata and export redaction requirements.

### Modified Capabilities

- None.

## Impact

- Backend: settings contracts/repository/service/API handler tests.
- Frontend: settings export builder, security popup, export UI errors, tests.
- Validation: backend/frontend tests and manual export inspection.
