## 1. Roadmap and Context

- [ ] 1.1 Update `openspec/config.yaml` to reflect current backend-owned persistence and HTTP repository state.
- [ ] 1.2 Update `openspec/changes/IMPLEMENTATION_ORDER.md` so completed archived changes and future-gated auth state are accurate.
- [ ] 1.3 Confirm `add-auth-user-ownership` remains active but not implemented.

## 2. Canonical Spec Metadata

- [ ] 2.1 Replace placeholder `Purpose: TBD` sections in canonical specs with concise purposes.
- [ ] 2.2 Add or update a lightweight capability-to-validation traceability matrix.

## 3. Validation

- [ ] 3.1 Run `openspec validate repair-openspec-roadmap-state --strict --no-interactive`.
- [ ] 3.2 Run `openspec validate --changes --strict --no-interactive`.
- [ ] 3.3 Run `openspec validate --specs --strict --no-interactive`.
- [ ] 3.4 Confirm no frontend/backend runtime files changed.
