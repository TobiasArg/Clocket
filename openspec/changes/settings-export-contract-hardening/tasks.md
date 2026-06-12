## 1. Export Contract Definition

- [ ] 1.1 Define versioned settings export snapshot contract with manifest, exported timestamp, domain sections, counts, and checksum metadata.
- [ ] 1.2 Define required included domains: settings, accounts, categories, budgets, goals, cuotas, transactions, investment positions, and investment refs.
- [ ] 1.3 Define controlled behavior for partial read failures and incomplete snapshots.
- [ ] 1.4 Explicitly document that import/restore is out of scope.

## 2. Backend/Frontend Export Boundary

- [ ] 2.1 Decide whether the first implementation exposes a backend export endpoint or a frontend builder using backend-only repository responses.
- [ ] 2.2 Ensure the export builder reads only backend-canonical HTTP/API data.
- [ ] 2.3 Add checksum/digest generation over stable serialized export data.
- [ ] 2.4 Preserve existing transaction CSV export as a separate convenience export.

## 3. Tests

- [ ] 3.1 Add tests for version, manifest, exportedAt, included domains, counts, and checksum generation.
- [ ] 3.2 Add tests proving full JSON export does not read from localStorage repositories.
- [ ] 3.3 Add tests for controlled partial failure behavior.
- [ ] 3.4 Add tests confirming CSV export remains transaction-only and does not claim full-backup completeness.

## 4. Validation

- [ ] 4.1 Run `npm --prefix frontend test`.
- [ ] 4.2 Run `npm --prefix frontend run build`.
- [ ] 4.3 Run backend tests/build if a backend export endpoint is added.
- [ ] 4.4 Run `openspec validate settings-export-contract-hardening --strict --no-interactive`.
- [ ] 4.5 Confirm import/restore, localStorage import, auth, sessions, authorization, and user ownership remain out of scope.
