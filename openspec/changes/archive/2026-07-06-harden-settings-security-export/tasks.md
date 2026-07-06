## 1. Contract Redaction

- [x] 1.1 Update backend settings response contracts to expose safe security metadata instead of `pinHash`.
- [x] 1.2 Update frontend settings types and consumers to use safe security metadata.
- [x] 1.3 Ensure full JSON export redacts PIN hashes from `data.settings`.

## 2. UX and Error Handling

- [x] 2.1 Update security UI copy so PIN behavior is not overstated.
- [x] 2.2 Surface domain-aware export failures with calm actionable copy.

## 3. Tests

- [x] 3.1 Add backend tests proving GET settings does not expose `pinHash`.
- [x] 3.2 Add frontend export tests proving JSON backups do not include `pinHash`.
- [x] 3.3 Add UI/unit tests for export domain failure messages where feasible.

## 4. Validation

- [x] 4.1 Run `npm --prefix backend test` and `npm --prefix backend run build`.
- [x] 4.2 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [x] 4.3 Manually export JSON after enabling PIN and inspect that no hash is present.
- [x] 4.4 Run `openspec validate harden-settings-security-export --strict --no-interactive`.
