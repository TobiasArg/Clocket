## 1. Backend Analytics Read Models

- [x] 1.1 Add analytics contracts for home summary, statistics summary, category breakdowns, cash-flow buckets, account summaries, and goal trend points.
- [x] 1.2 Add backend analytics services that read canonical accounts, transactions, categories, goals, and installments.
- [x] 1.3 Implement monthly balance, income/expense/savings classification, and category aggregation in backend services.
- [x] 1.4 Implement day/week/month trend buckets with explicit date range semantics.
- [x] 1.5 Add analytics API handlers and validate query params for scope/view/date boundaries.

## 2. Backend Tests

- [x] 2.1 Test monthly income, expense, net, and savings calculations.
- [x] 2.2 Test goal-linked savings behavior in analytics buckets.
- [x] 2.3 Test category breakdowns use backend category refs and fallback behavior.
- [x] 2.4 Test day/week/month bucket ranges and empty-state responses.
- [x] 2.5 Validate backend with `npm --prefix backend test` and `npm --prefix backend run build`.

## 3. Frontend Cutover

- [x] 3.1 Add frontend HTTP repository/client methods for analytics endpoints.
- [x] 3.2 Update home/statistics page models so they consume backend read models instead of recomputing canonical analytics from raw records.
- [x] 3.3 Preserve existing UI labels, cards, charts, empty states, and loading/error behavior.
- [x] 3.4 Keep local statistics scope preference as UI-only state.
- [x] 3.5 Add/update frontend mapping tests.

## 4. Final Verification

- [x] 4.1 Run `openspec validate backend-owned-financial-analytics-read-models --strict --no-interactive`.
- [x] 4.2 Run `npm --prefix frontend test` and `npm --prefix frontend run build`.
- [x] 4.3 Compare backend analytics outputs against a fixed QA dataset.
- [x] 4.4 Confirm auth, sessions, authorization, `userId`, shared ledgers, and localStorage import remain out of scope.
