## Context

The repository has local scripts for frontend and backend validation, but CI only executes frontend `build:ci`. The audit found this is a P0 quality risk because backend/API/OpenSpec regressions can merge without automated feedback.

## Goals / Non-Goals

**Goals:**

- Align CI with the repository validation baseline.
- Keep workflows path-aware where useful, but avoid missing cross-boundary breakages.
- Add DB smoke validation with a disposable PostgreSQL service.

**Non-Goals:**

- No production deployment or release workflow.
- No secret-dependent provider integration tests.
- No mandatory browser E2E unless a future spec adds it.

## Decisions

1. **Use npm scripts already present.** CI should call existing `frontend` and `backend` scripts before adding new tooling.
2. **OpenSpec validates both active changes and canonical specs.** CI SHALL run strict validation for changes/specs on relevant PRs.
3. **DB smoke is isolated.** PostgreSQL smoke uses GitHub Actions service containers and `RUN_DB_TESTS=1`, not developer-local Docker assumptions.
4. **Bundle budget expands separately.** The existing budget remains, but this change may extend it to total JS/CSS/chunk budgets if practical.

## Risks / Trade-offs

- CI runtime will increase → use dependency caching and path filters carefully.
- DB tests may be flaky if migrations are not deterministic → start with smoke and expand gradually.
- OpenSpec CLI availability must be handled consistently in CI.
