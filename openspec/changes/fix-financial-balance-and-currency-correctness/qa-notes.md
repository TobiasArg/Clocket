# Financial Balance and Currency Correctness QA Notes

## Migration caveat

Displayed account balance now follows the product contract:

```text
displayed balance = account opening balance + eligible non-saving transaction net flow
```

Existing accounts may have opening balances that users entered after already accounting for historical transactions. Those accounts can appear double-counted once transaction flow is added. The recommended remediation is manual data cleanup: either adjust the opening balance to the true starting balance or remove historical transactions that were already included in the opening balance. No automatic migration is performed in this change.

## Focused manual QA checklist

- Accounts: create an account with opening balance `1000`; verify the displayed account balance is `1000` before transactions and `900` after a regular expense of `100`.
- Home: verify the total balance slide and per-account slides include opening balance plus non-saving flow.
- Budgets: create mixed USD/ARS transactions under a budget and verify progress/spent/remaining use the selected display currency basis.
- Goals: verify saved/target/progress values recompute after currency switching.
- Cuotas: verify pending installment labels switch currency consistently and remain silent if the backend rate is the default fallback.
- Statistics: edit a transaction amount/category without changing transaction count; verify charts/totals refetch/recompute.
- Settings: switch between ARS/USD and verify Home, Budgets, Goals, Cuotas, and Statistics use matching symbols and numeric basis.
