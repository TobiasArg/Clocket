import { describe, expect, it } from "vitest";
import { BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN } from "@/utils";
import {
  sanitizeScopeRulesForCategories,
  type BudgetCategoryOption,
} from "./useBudgetsPageModel";

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
});
