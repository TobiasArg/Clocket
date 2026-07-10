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

## Workflow path filters

| Workflow | Trigger paths | Safety rationale |
| --- | --- | --- |
| `frontend-bundle-check.yml` | `frontend/**`, workflow file | Frontend tests, typecheck, lint, build, and bundle budget only depend on frontend package/source/config inputs. |
| `backend-quality.yml` | `backend/**`, workflow file | Backend unit tests, typecheck, Prisma validation, and build only depend on backend package/source/config inputs. |
| `openspec-validation.yml` | `openspec/**`, workflow file | OpenSpec strict validation is required when change/spec artifacts or the workflow itself change. |
| `backend-db-smoke.yml` | `backend/prisma/**`, `backend/src/persistence/**`, backend package lock/manifest, workflow file | PostgreSQL smoke is targeted to persistence-sensitive inputs: Prisma schema/migrations, DB client/config/tests, and dependency changes. Manual `workflow_dispatch` remains available for explicit verification outside these paths. |

## Risks / Trade-offs

- CI runtime will increase → use dependency caching and path filters carefully.
- DB tests may be flaky if migrations are not deterministic → start with smoke and expand gradually.
- OpenSpec CLI availability must be handled consistently in CI.
