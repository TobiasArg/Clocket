import type { TransactionItem } from "@/domain/transactions/repository";
import type { BudgetPlan, BudgetScopeRule } from "@/types";

export const BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN = "__none__" as const;

const normalizeSubcategoryName = (value: string): string => value.trim();

const normalizeCategoryId = (value: string): string => value.trim();

const resolveSubcategoryToken = (subcategoryName?: string): string => {
  const normalized = subcategoryName?.trim();
  if (!normalized) {
    return BUDGET_SCOPE_NONE_SUBCATEGORY_TOKEN;
  }

  return normalized;
};

const normalizeSelectedSubcategories = (subcategoryNames: string[] | undefined): string[] => {
  if (!Array.isArray(subcategoryNames)) {
    return [];
  }

  const unique = new Set<string>();
  subcategoryNames.forEach((subcategoryName) => {
    const normalized = normalizeSubcategoryName(subcategoryName);
    if (normalized.length === 0) {
      return;
    }

    unique.add(normalized);
  });

  return Array.from(unique);
};

const mergeScopeRules = (rules: BudgetScopeRule[]): BudgetScopeRule[] => {
  const mergedByCategoryId = new Map<string, BudgetScopeRule>();

  rules.forEach((rule) => {
    const existing = mergedByCategoryId.get(rule.categoryId);
    if (!existing) {
      mergedByCategoryId.set(rule.categoryId, rule);
      return;
    }

    if (existing.mode === "all_subcategories" || rule.mode === "all_subcategories") {
      mergedByCategoryId.set(rule.categoryId, {
        categoryId: rule.categoryId,
        mode: "all_subcategories",
      });
      return;
    }

    const combined = new Set<string>([
      ...normalizeSelectedSubcategories(existing.subcategoryNames),
      ...normalizeSelectedSubcategories(rule.subcategoryNames),
    ]);

    mergedByCategoryId.set(rule.categoryId, {
      categoryId: rule.categoryId,
      mode: "selected_subcategories",
      subcategoryNames: Array.from(combined),
    });
  });

  return Array.from(mergedByCategoryId.values());
};

export const normalizeBudgetScopeRules = (
  scopeRules: BudgetScopeRule[] | undefined,
  legacyCategoryId?: string,
): BudgetScopeRule[] => {
  const normalizedRules: BudgetScopeRule[] = [];

  if (Array.isArray(scopeRules)) {
    scopeRules.forEach((rule) => {
      const categoryId = normalizeCategoryId(rule.categoryId);
      if (categoryId.length === 0) {
        return;
      }

      if (rule.mode === "selected_subcategories") {
        const subcategoryNames = normalizeSelectedSubcategories(rule.subcategoryNames);
        if (subcategoryNames.length === 0) {
          return;
        }

        normalizedRules.push({
          categoryId,
          mode: "selected_subcategories",
          subcategoryNames,
        });
        return;
      }

      normalizedRules.push({
        categoryId,
        mode: "all_subcategories",
      });
    });
  }

  if (normalizedRules.length > 0) {
    return mergeScopeRules(normalizedRules);
  }

  const normalizedLegacyCategoryId = normalizeCategoryId(legacyCategoryId ?? "");
  if (normalizedLegacyCategoryId.length === 0) {
    return [];
  }

  return [{
    categoryId: normalizedLegacyCategoryId,
    mode: "all_subcategories",
  }];
};

export const getPrimaryBudgetCategoryId = (
  scopeRules: BudgetScopeRule[] | undefined,
  legacyCategoryId?: string,
): string | null => {
  const normalizedRules = normalizeBudgetScopeRules(scopeRules, legacyCategoryId);
  if (normalizedRules.length > 0) {
    return normalizedRules[0].categoryId;
  }

  return null;
};

export const doesBudgetScopeRuleMatchTransaction = (
  scopeRule: BudgetScopeRule,
  transaction: TransactionItem,
): boolean => {
  if (!transaction.categoryId || normalizeCategoryId(transaction.categoryId) !== scopeRule.categoryId) {
    return false;
  }

  if (scopeRule.mode === "all_subcategories") {
    return true;
  }

  const selectedSubcategories = new Set(normalizeSelectedSubcategories(scopeRule.subcategoryNames));
  if (selectedSubcategories.size === 0) {
    return false;
  }

  const transactionSubcategoryToken = resolveSubcategoryToken(transaction.subcategoryName);
  return selectedSubcategories.has(transactionSubcategoryToken);
};

export const doesBudgetScopeMatchTransaction = (
  scopeRules: BudgetScopeRule[] | undefined,
  transaction: TransactionItem,
  legacyCategoryId?: string,
): boolean => {
  const normalizedRules = normalizeBudgetScopeRules(scopeRules, legacyCategoryId);
  return normalizedRules.some((scopeRule) => doesBudgetScopeRuleMatchTransaction(scopeRule, transaction));
};

const getRuleSubcategorySet = (rule: BudgetScopeRule): Set<string> => {
  if (rule.mode === "all_subcategories") {
    return new Set<string>();
  }

  return new Set<string>(normalizeSelectedSubcategories(rule.subcategoryNames));
};

export const doBudgetScopeRulesOverlap = (
  leftRules: BudgetScopeRule[] | undefined,
  rightRules: BudgetScopeRule[] | undefined,
): boolean => {
  const normalizedLeftRules = normalizeBudgetScopeRules(leftRules);
  const normalizedRightRules = normalizeBudgetScopeRules(rightRules);

  if (normalizedLeftRules.length === 0 || normalizedRightRules.length === 0) {
    return false;
  }

  const rightRulesByCategoryId = new Map<string, BudgetScopeRule>();
  normalizedRightRules.forEach((rule) => {
    rightRulesByCategoryId.set(rule.categoryId, rule);
  });

  for (const leftRule of normalizedLeftRules) {
    const rightRule = rightRulesByCategoryId.get(leftRule.categoryId);
    if (!rightRule) {
      continue;
    }

    if (leftRule.mode === "all_subcategories" || rightRule.mode === "all_subcategories") {
      return true;
    }

    const leftSubcategories = getRuleSubcategorySet(leftRule);
    const rightSubcategories = getRuleSubcategorySet(rightRule);
    for (const subcategoryName of leftSubcategories) {
      if (rightSubcategories.has(subcategoryName)) {
        return true;
      }
    }
  }

  return false;
};

export const resolveBudgetScopeRulesFromBudget = (budget: BudgetPlan): BudgetScopeRule[] => {
  return normalizeBudgetScopeRules(budget.scopeRules, budget.categoryId);
};
