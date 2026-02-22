import { describe, expect, it } from "vitest";
import type { BudgetPlanItem, TransactionItem } from "@/utils";
import { BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN } from "@/utils";
import {
  buildBudgetExpensesById,
  sanitizeScopeRulesForCategories,
  type BudgetCategoryOption,
} from "./useBudgetsPageModel";

const monthWindow = {
  start: new Date(2026, 1, 1, 0, 0, 0, 0),
  end: new Date(2026, 2, 1, 0, 0, 0, 0),
};

const buildTransaction = (patch: Partial<TransactionItem> = {}): TransactionItem => ({
  id: "tx_1",
  accountId: "acc_1",
  transactionType: "regular",
  icon: "wallet",
  iconBg: "bg-[#111827]",
  name: "Compra",
  category: "Comida",
  amount: "-$100",
  amountColor: "text-[#DC2626]",
  meta: "2026-02-10",
  date: "2026-02-10",
  categoryId: "cat_food",
  ...patch,
});

describe("useBudgetsPageModel helpers", () => {
  it("sanitizes selected subcategories against available category subcategories", () => {
    const categories: BudgetCategoryOption[] = [
      {
        id: "cat_food",
        name: "Comida",
        icon: "fork-knife",
        iconBg: "bg-[#DC2626]",
        subcategories: ["Super", "Delivery"],
      },
    ];

    const sanitized = sanitizeScopeRulesForCategories(
      [
        {
          categoryId: "cat_food",
          mode: "selected_subcategories",
          subcategoryNames: ["Super", "No Existe", BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN],
        },
      ],
      categories,
    );

    expect(sanitized).toEqual([
      {
        categoryId: "cat_food",
        mode: "selected_subcategories",
        subcategoryNames: ["Super", BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN],
      },
    ]);
  });

  it("builds expenses map by budget id using scope matcher", () => {
    const budgets: BudgetPlanItem[] = [
      {
        id: "budget_food",
        categoryId: "cat_food",
        scopeRules: [
          {
            categoryId: "cat_food",
            mode: "selected_subcategories",
            subcategoryNames: ["Delivery"],
          },
        ],
        name: "Comida delivery",
        limitAmount: 1000,
        month: "2026-02",
        createdAt: "2026-02-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
      },
    ];

    const expensesByBudgetId = buildBudgetExpensesById(
      budgets,
      [
        buildTransaction({ id: "tx_1", amount: "-$300", subcategoryName: "Delivery" }),
        buildTransaction({ id: "tx_2", amount: "-$200", subcategoryName: "Super" }),
        buildTransaction({ id: "tx_3", amount: "$900", subcategoryName: "Delivery" }),
      ],
      monthWindow,
    );

    expect(expensesByBudgetId.get("budget_food")).toBe(300);
  });
});
