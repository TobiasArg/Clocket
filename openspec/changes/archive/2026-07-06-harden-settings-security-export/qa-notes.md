# QA Notes — harden-settings-security-export

## Security redaction checks

- Backend settings responses now expose `security.hasPin` and omit `security.pinHash`.
- Frontend JSON backup generation sanitizes `data.settings.security` before checksum and download payload creation.
- Legacy settings payloads that still contain `security.pinHash` are normalized to `security.hasPin` and the verifier string is excluded from serialized backup JSON.

## PIN update behavior

- Existing PIN update/removal requires a write-only `security.currentPinHash` value.
- The stored verifier remains server/internal only; clients hash the typed current PIN and submit it only with the update request.
- PIN copy is intentionally scoped to local app controls and does not claim account authentication or backup encryption.

## Export failure copy

- `SettingsExportError.domain` is mapped to calm Spanish copy identifying the affected export area.
- Technical cause messages are not surfaced in the UI copy.

## Manual export inspection

- Validation fixture generated a full JSON backup with a PIN-enabled legacy settings payload (`legacy-secret-pin-hash`).
- Inspected serialized payload assertions prove:
  - `data.settings.security` is `{ "hasPin": true }`.
  - Serialized JSON does not contain `pinHash`.
  - Serialized JSON does not contain the stored verifier value.
