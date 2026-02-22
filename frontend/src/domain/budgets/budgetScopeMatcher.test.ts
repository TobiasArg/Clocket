import { describe, expect, it } from "vitest";
import type { BudgetPlan, BudgetScopeRule } from "@/types";
import type { TransactionItem } from "@/domain/transactions/repository";
import {
  BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN,
  doBudgetScopeRulesOverlap,
  doesBudgetScopeMatchTransaction,
  normalizeBudgetScopeRules,
  resolveBudgetScopeRulesFromBudget,
} from "./budgetScopeMatcher";

const buildTransaction = (patch: Partial<TransactionItem> = {}): TransactionItem => ({
  id: "tx_1",
  accountId: "acc_1",
  transactionType: "regular",
  icon: "wallet",
  iconBg: "bg-[#111827]",
  name: "Compra",
  category: "Comida",
  amount: "-$1200",
  amountColor: "text-[#DC2626]",
  meta: "2026-02-10",
  date: "2026-02-10",
  categoryId: "cat_food",
  ...patch,
});

describe("budgetScopeMatcher", () => {
  it("normalizes and merges duplicated category rules", () => {
    const normalized = normalizeBudgetScopeRules([
      { categoryId: " cat_food ", mode: "selected_subcategories", subcategoryNames: [" Super "] },
      { categoryId: "cat_food", mode: "selected_subcategories", subcategoryNames: ["Delivery"] },
    ]);

    expect(normalized).toEqual<BudgetScopeRule[]>([
      {
        categoryId: "cat_food",
        mode: "selected_subcategories",
        subcategoryNames: ["Super", "Delivery"],
      },
    ]);
  });

  it("matches transactions with no subcategory using internal none token", () => {
    const scopeRules: BudgetScopeRule[] = [
      {
        categoryId: "cat_food",
        mode: "selected_subcategories",
        subcategoryNames: [BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN],
      },
    ];

    expect(doesBudgetScopeMatchTransaction(scopeRules, buildTransaction({ subcategoryName: "" }))).toBe(true);
    expect(doesBudgetScopeMatchTransaction(scopeRules, buildTransaction({ subcategoryName: "Delivery" }))).toBe(false);
  });

  it("detects overlap between all-subcategories and selected-subcategories", () => {
    const left: BudgetScopeRule[] = [{ categoryId: "cat_food", mode: "all_subcategories" }];
    const right: BudgetScopeRule[] = [
      { categoryId: "cat_food", mode: "selected_subcategories", subcategoryNames: ["Delivery"] },
    ];

    expect(doBudgetScopeRulesOverlap(left, right)).toBe(true);
  });

  it("resolves scope from legacy budget category id", () => {
    const legacyBudget = {
      id: "budget_legacy",
      categoryId: "cat_food",
      scopeRules: [],
      name: "Comida",
      limitAmount: 1000,
      month: "2026-02",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    } satisfies BudgetPlan;

    expect(resolveBudgetScopeRulesFromBudget(legacyBudget)).toEqual<BudgetScopeRule[]>([
      { categoryId: "cat_food", mode: "all_subcategories" },
    ]);
  });
});
