import { describe, expect, it } from "vitest";
import { formatCurrency, type BudgetScopeRule, type TransactionItem } from "@/utils";
import { buildBudgetDetailSubcategoryItems } from "./useBudgetDetailPageModel";

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

describe("buildBudgetDetailSubcategoryItems", () => {
  it("builds grouped rows using Category · Subcategory labels", () => {
    const scopeRules: BudgetScopeRule[] = [
      { categoryId: "cat_food", mode: "all_subcategories" },
      {
        categoryId: "cat_transport",
        mode: "selected_subcategories",
        subcategoryNames: ["Taxi"],
      },
    ];

    const categoryById = new Map<string, { name: string; iconBg: string }>([
      ["cat_food", { name: "Comida", iconBg: "bg-[#DC2626]" }],
      ["cat_transport", { name: "Transporte", iconBg: "bg-[#2563EB]" }],
    ]);

    const items = buildBudgetDetailSubcategoryItems({
      categoryById,
      monthWindow,
      scopeRules,
      transactions: [
        buildTransaction({ id: "tx_1", amount: "-$250", subcategoryName: "Delivery" }),
        buildTransaction({ id: "tx_2", amount: "-$100", subcategoryName: "" }),
        buildTransaction({
          id: "tx_3",
          categoryId: "cat_transport",
          category: "Transporte",
          amount: "-$70",
          subcategoryName: "Taxi",
        }),
      ],
    });

    expect(items.map((item) => item.name)).toEqual([
      "Comida · Delivery",
      "Comida · Sin subcategoría",
      "Transporte · Taxi",
    ]);

    expect(items[0].amount).toBe(formatCurrency(250));
    expect(items[1].amount).toBe(formatCurrency(100));
    expect(items[2].amount).toBe(formatCurrency(70));
  });

  it("ignores incomes and transactions outside selected month", () => {
    const items = buildBudgetDetailSubcategoryItems({
      categoryById: new Map<string, { name: string; iconBg: string }>([
        ["cat_food", { name: "Comida", iconBg: "bg-[#DC2626]" }],
      ]),
      monthWindow,
      scopeRules: [{ categoryId: "cat_food", mode: "all_subcategories" }],
      transactions: [
        buildTransaction({ id: "tx_1", amount: "$500", subcategoryName: "Delivery" }),
        buildTransaction({ id: "tx_2", amount: "-$120", date: "2026-03-01", meta: "2026-03-01" }),
      ],
    });

    expect(items).toEqual([]);
  });
});
