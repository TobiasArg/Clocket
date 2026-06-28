## Context

Core finance CRUD is backend-owned, but some classification and category integrity rules still live in frontend page models. Income category eligibility should not depend on display names, and category/subcategory constraints should be enforced server-side.

## Goals / Non-Goals

**Goals:**

- Backend owns transaction classification and category/subcategory reference validation.
- Backend exposes or validates category eligibility for transaction modes.
- Backend owns duplicate and in-use category/subcategory constraints.
- Frontend preserves forms while displaying backend validation results.

**Non-Goals:**

- No auth/user ownership or shared category namespaces.
- No full ledger balance reconciliation.
- No UI redesign.

## Decisions

1. **Backend owns category classification.** Income/expense/saving eligibility must not rely on category name/id string heuristics.
2. **Backend validates references.** Account/category/subcategory references are validated on transaction create/update.
3. **Backend derives presentation metadata where canonical.** Icons, labels, and classification returned from backend should be used by frontend display.
4. **Backend owns category constraints.** Normalized duplicates and in-use deletion behavior return controlled responses.
5. **Single-ledger until auth.** Per-user category namespaces are deferred.

## Risks / Trade-offs

- Existing schema may need classification metadata or a conservative first pass using backend-defined defaults.
- In-use deletion behavior must avoid breaking existing flows unexpectedly.
- Frontend mapper tests are required to preserve editor behavior.

## Migration Plan

1. Add backend contracts/services/tests for classification and constraints.
2. Add frontend category option/validation mapping.
3. Remove canonical name/id heuristics from transaction page model.
4. Validate transaction/category flows manually and via tests.
