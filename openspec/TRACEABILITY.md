# OpenSpec Capability-to-Validation Traceability

This matrix maps canonical OpenSpec capabilities to representative validation. It is intentionally lightweight: use it to find the first tests or manual QA paths to run when touching an existing capability, not as a complete coverage report.

Maintenance rule: when archiving a change that adds or materially modifies a canonical spec, update this file in the same docs/archive commit.

## Canonical capability matrix

| Capability | Representative automated validation | Representative manual QA / review |
| --- | --- | --- |
| `backend-owned-budget-usage-read-models` | `backend/src/modules/budgets/budgetUsageService.test.ts`; `backend/src/modules/budgets/budgetsApiHandler.test.ts`; `frontend/src/hooks/useBudgetsPageModel.test.ts` | Budgets page month switch, budget detail breakdown, overspent/remaining values, empty budget month. |
| `backend-owned-exchange-rate-boundary` | `backend/src/modules/exchange-rates/exchangeRateHandler.test.ts`; `frontend/src/data/http/exchangeRatesRepository.test.ts` | Verify `/api/exchange-rates?baseCurrency=USD&quoteCurrency=ARS` and UI currency fallback behavior. |
| `backend-owned-financial-analytics-read-models` | `backend/src/modules/analytics/analyticsService.test.ts`; `backend/src/modules/analytics/analyticsApiHandler.test.ts`; `frontend/src/data/http/analyticsRepository.test.ts` | Home and Statistics cards/charts after transaction create/edit/delete and browser refresh. |
| `backend-owned-goal-progress-and-entry-resolution` | `backend/src/modules/goals/goalsRepository.test.ts`; `backend/src/modules/goals/goalsApiHandler.test.ts`; `frontend/src/data/http/featureRepositories.test.ts` | Goals list/detail progress, contribution entry create/delete, missing referenced account/transaction handling. |
| `backend-owned-installment-ledger-effects` | `backend/src/modules/installments/installmentLedgerEffectsService.test.ts`; `backend/src/modules/installments/installmentPlansApiHandler.test.ts`; `frontend/src/utils/cuotasDateUtils.test.ts` | Mark cuota paid, future-date blocked state, repeated mark-paid retry, plan deletion/reload. |
| `backend-owned-market-refresh` | `backend/src/modules/investments/investmentMarketRefreshService.test.ts`; `backend/src/modules/market/marketQuoteHandler.test.ts`; `frontend/src/domain/investments/refreshPositions.test.ts` | Investments automatic refresh, force refresh, provider error/stale fallback, cooldown message. |
| `backend-owned-transaction-classification-and-category-constraints` | `backend/src/modules/transactions/transactionsService.test.ts`; `backend/src/modules/transactions/transactionsApiHandler.test.ts`; `backend/src/modules/categories/categoriesService.test.ts`; `frontend/src/domain/currency/transactionCurrency.test.ts` | Transaction category/subcategory validation, category deletion constraints, transaction form error state. |
| `feature-domain-api-service-boundary` | `backend/src/modules/core-finance/featureDomainApiHandlers.test.ts`; `backend/src/modules/core-finance/coreFinanceApiErrors.test.ts`; `frontend/src/data/http/featureRepositories.test.ts` | CRUD through HTTP repositories for migrated budgets, goals, cuotas, investments, and settings. |
| `feature-domain-clean-start-boundary` | `frontend/src/data/localStorage/cleanStartCutover.test.ts`; `frontend/src/data/runtimeRepositoryBoundary.test.ts` | Launch app with legacy localStorage keys and confirm backend data remains canonical. |
| `feature-domain-clean-start-verification` | `frontend/src/data/localStorage/cleanStartCutover.test.ts`; `frontend/src/data/http/featureRepositories.test.ts` | Browser refresh after backend-created records; verify no localStorage import/merge path is used. |
| `feature-domain-runtime-stability` | `backend/src/modules/core-finance/featureDomainApiHandlers.test.ts`; `backend/src/persistence/prismaSmoke.test.ts`; `frontend/src/data/http/featureRepositories.test.ts` | Invalid payloads return calm errors; backend read-after-write persists after refresh. |
| `feature-domain-validation` | `backend/src/modules/core-finance/coreFinanceApiErrors.test.ts`; domain-specific API handler tests under `backend/src/modules/**` | Submit invalid money/date/enum/reference values and confirm controlled 4xx behavior. |
| `frontend-feature-flow-regression` | `frontend/src/data/http/featureRepositories.test.ts`; `frontend/src/hooks/useBudgetsPageModel.test.ts`; `frontend/src/hooks/useInvestmentsPageModel.test.ts` | Migrated domain list/create/edit/delete flows, empty/error states, no stale localStorage-only calls. |
| `frontend-feature-repository-cutover` | `frontend/src/data/runtimeRepositoryBoundary.test.ts`; `frontend/src/data/http/featureRepositories.test.ts` | Inspect runtime barrels and smoke migrated pages against backend APIs. |
| `frontend-investment-refresh-cutover` | `frontend/src/domain/investments/refreshPositions.test.ts`; `frontend/src/hooks/useInvestmentsPageModel.test.ts`; `frontend/src/data/http/marketQuoteApiClient.test.ts` | Manual and automatic investment refresh uses backend endpoint and preserves stale portfolio values. |
| `frontend-localstorage-repository-retirement` | `frontend/src/data/runtimeRepositoryBoundary.test.ts`; `frontend/src/data/localStorage/repositoriesSmoke.test.ts` | Review public runtime exports and confirm legacy repositories are test/compatibility-only. |
| `manual-qa-validation` | N/A — evidence artifact requirement | Maintain focused QA notes in change `tasks.md` or dedicated QA evidence docs before archiving. |
| `market-refresh-validation` | `backend/src/modules/investments/investmentMarketRefreshService.test.ts`; `frontend/src/domain/investments/refreshPositions.test.ts` | Document provider success/failure, stale fallback, forced refresh, and persisted snapshot/ref QA. |
| `settings-export-contract-hardening` | `frontend/src/utils/settingsExport.test.ts`; `frontend/src/utils/securityPin.test.ts`; `backend/src/modules/settings/settingsService.test.ts` | Settings export JSON/CSV excludes PIN verifier material and reports domain read failures clearly. |

## Baseline commands

Run the narrow tests above when touching a capability. For broader validation, use:

```bash
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix backend test
npm --prefix backend run build
openspec validate --changes --strict --no-interactive
openspec validate --specs --strict --no-interactive
```
