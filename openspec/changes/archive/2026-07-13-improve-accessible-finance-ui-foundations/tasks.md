## 1. Dialog and Sheet Foundation

- [x] 1.1 Add accessible dialog/sheet semantics, labels, Escape handling, initial focus, and focus restoration.
- [x] 1.2 Migrate transaction editor and settings popups to the accessible foundation where applicable.
- [x] 1.3 Add or update tests for close behavior and basic accessibility attributes where feasible.

## 2. Destructive Actions

- [x] 2.1 Add keyboard-accessible delete actions for accounts and transactions without requiring swipe.
- [x] 2.2 Ensure account, transaction, and investment delete confirmations share semantic dialog behavior.
- [x] 2.3 Replace native `window.confirm` usage with product-consistent dialogs.

## 3. App Semantics and Copy

- [x] 3.1 Add main landmark, nav semantics, active navigation state, and heading hierarchy improvements.
- [x] 3.2 Add live-region/status behavior for async save/export/error updates where missing.
- [x] 3.3 Normalize affected copy to calm Spanish product terminology.

## 4. Validation

- [x] 4.1 Run `npm --prefix frontend test`, `npm --prefix frontend run typecheck`, and `npm --prefix frontend run build`.
- [x] 4.2 Manually validate keyboard-only account/transaction delete, sheet open/close, settings export, and route navigation.
- [x] 4.3 Run `openspec validate improve-accessible-finance-ui-foundations --strict --no-interactive`.
