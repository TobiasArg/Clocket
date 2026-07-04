import { describe, expect, it } from "vitest";
import {
  buildAccountFlowsById,
  getDisplayedAccountBalance,
} from "./accountBalances";

describe("account balance helpers", () => {
  it("includes opening balance when an account has no transactions", () => {
    const account = { id: "account-1", balance: 1000, currency: "ARS" as const };

    expect(getDisplayedAccountBalance(account, undefined, "ARS", 1500)).toBe(1000);
  });

  it("adds eligible transaction net flow to opening balance", () => {
    const account = { id: "account-1", balance: 1000, currency: "ARS" as const };
    const flows = buildAccountFlowsById([
      { accountId: "account-1", amount: "-ARS 100.00", transactionType: "regular" },
      { accountId: "account-1", amount: "+ARS 25.00", transactionType: "regular" },
      { accountId: "account-1", amount: "-ARS 500.00", transactionType: "saving", goalId: "goal-1" },
    ]);

    expect(getDisplayedAccountBalance(account, flows.get(account.id), "ARS", 1500)).toBe(925);
  });

  it("converts opening balances to the selected display currency", () => {
    const account = { id: "account-1", balance: 2, currency: "USD" as const };

    expect(getDisplayedAccountBalance(account, undefined, "ARS", 1500)).toBe(3000);
  });
});
