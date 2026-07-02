## Context

Current settings records include `security.pinHash`. The frontend can set and verify a PIN locally, but the PIN does not enforce global access control. Exporting or returning the hash creates a trust and privacy risk because a four-digit PIN is brute-forceable.

## Goals / Non-Goals

**Goals:**

- Ensure settings APIs and backup exports do not expose raw PIN hashes.
- Preserve enough metadata for UI to show whether a PIN is configured.
- Make export domain errors actionable without leaking sensitive internals.

**Non-Goals:**

- No auth/user ownership activation.
- No encrypted export/import contract.
- No server-side account lockout or recovery flow.

## Decisions

1. **Use `hasPin` for public settings.** API and export contracts expose `security.hasPin: boolean` or equivalent, not `pinHash`.
2. **Keep write path controlled.** The update path may accept a new hash until a fuller security redesign exists, but read/export paths MUST redact it.
3. **Do not overstate PIN security.** UI copy should describe the PIN as local app protection only unless backend enforcement is implemented later.
4. **Domain-aware export errors.** `SettingsExportError.domain` should be surfaced in user-friendly copy.

## Risks / Trade-offs

- Existing frontend code may expect `pinHash` after GET settings → update type contracts and tests together.
- Full redaction can break future import/restore assumptions → import remains out of scope and must be specified separately.
- A stronger PIN KDF may be desirable later → keep this change focused on exposure prevention.
