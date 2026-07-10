## Why

Local validation is strong, but CI currently runs only the frontend bundle check. Backend changes, frontend tests, lint/typecheck, OpenSpec validation, and database smoke coverage can regress without a blocking automated gate.

## What Changes

- Add CI quality gates for frontend tests, lint, typecheck, build, and bundle budget.
- Add CI quality gates for backend tests, typecheck, Prisma validation, and build.
- Add OpenSpec strict validation to CI.
- Add an optional/targeted PostgreSQL smoke workflow for persistence-sensitive changes.
- Non-goal: deployment automation, production secrets, release publishing, or changing app runtime behavior.

## Capabilities

### New Capabilities

- `ci-quality-gates-hardening`: Required CI validation coverage for frontend, backend, OpenSpec, and DB smoke.

### Modified Capabilities

- None.

## Impact

- CI workflows under `.github/workflows/`.
- Package scripts if needed for consistent command names.
- Documentation in testing/validation rules.
