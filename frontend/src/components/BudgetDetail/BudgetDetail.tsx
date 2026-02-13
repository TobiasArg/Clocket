import { useMemo } from "react";
import type { SubcategoryItem } from "@/types";
import {
  BudgetHero,
  CardSection,
  CategoryItem,
  PhosphorIcon,
  ProgressSection,
  TextBadge,
} from "@/components";
import { useBudgets, useCategories, useTransactions } from "@/hooks";
import { formatCurrency, getCurrentMonthWindow, getTransactionDateForMonthBalance } from "@/utils";

export interface BudgetDetailProps {
  budgetId?: string;
  headerBg?: string;
  budgetIcon?: string;
  budgetName?: string;
  budgetDescription?: string;
  spentLabel?: string;
  spentValue?: string;
  percentBadgeText?: string;
  progressPercent?: number;
  progressColor?: string;
  progressUsedLabel?: string;
  progressRemainingLabel?: string;
  subcategoriesTitle?: string;
  addSubLabel?: string;
  subcategories?: SubcategoryItem[];
  loadingLabel?: string;
  emptyLabel?: string;
  onBackClick?: () => void;
  onEditClick?: () => void;
  onAddSubcategory?: () => void;
}

const COLORS = [
  { dot: "bg-[#DC2626]", bar: "bg-[#DC2626]" },
  { dot: "bg-[#F97316]", bar: "bg-[#F97316]" },
  { dot: "bg-[#8B5CF6]", bar: "bg-[#8B5CF6]" },
  { dot: "bg-[#06B6D4]", bar: "bg-[#06B6D4]" },
] as const;

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

export function BudgetDetail({
  budgetId,
  headerBg = "bg-[#DC2626]",
  budgetIcon,
  budgetName,
  budgetDescription,
  spentLabel = "Gastado",
  spentValue,
  percentBadgeText,
  progressPercent,
  progressColor = "bg-[#DC2626]",
  progressUsedLabel,
  progressRemainingLabel,
  subcategoriesTitle = "Subcategorías",
  addSubLabel = "Agregar",
  subcategories,
  loadingLabel = "Cargando budget...",
  emptyLabel = "No hay detalles para este budget.",
  onBackClick,
  onEditClick,
  onAddSubcategory,
}: BudgetDetailProps) {
  const { items: budgets, isLoading: isBudgetsLoading } = useBudgets();
  const { items: categories } = useCategories();
  const { items: transactions } = useTransactions();

  const monthWindow = useMemo(() => getCurrentMonthWindow(), []);
  const currentMonth = useMemo(() => {
    const year = monthWindow.start.getFullYear();
    const month = String(monthWindow.start.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [monthWindow]);

  const resolvedBudget = useMemo(() => {
    if (budgetId) {
      return budgets.find((budget) => budget.id === budgetId) ?? null;
    }

    return budgets.find((budget) => budget.month === currentMonth) ?? null;
  }, [budgetId, budgets, currentMonth]);

  const categoryMeta = useMemo(() => {
    if (!resolvedBudget) {
      return null;
    }

    return categories.find((category) => category.id === resolvedBudget.categoryId) ?? null;
  }, [categories, resolvedBudget]);

  const spentAmount = useMemo(() => {
    if (!resolvedBudget) {
      return 0;
    }

    return transactions.reduce((sum, transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return sum;
      }

      if (transactionDate < monthWindow.start || transactionDate >= monthWindow.end) {
        return sum;
      }

      if (transaction.categoryId !== resolvedBudget.categoryId) {
        return sum;
      }

      const amount = parseSignedAmount(transaction.amount);
      return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0);
  }, [monthWindow.end, monthWindow.start, resolvedBudget, transactions]);

  const detailSubcategories = useMemo<SubcategoryItem[]>(() => {
    if (subcategories) {
      return subcategories;
    }

    if (!resolvedBudget) {
      return [];
    }

    const grouped = new Map<string, number>();

    transactions.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      if (transactionDate < monthWindow.start || transactionDate >= monthWindow.end) {
        return;
      }

      if (transaction.categoryId !== resolvedBudget.categoryId) {
        return;
      }

      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0) {
        return;
      }

      grouped.set(transaction.name, (grouped.get(transaction.name) ?? 0) + Math.abs(amount));
    });

    const total = Array.from(grouped.values()).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return [];
    }

    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, amount], index) => {
        const percent = clampPercent((amount / total) * 100);
        const color = COLORS[index % COLORS.length];
        return {
          dotColor: color.dot,
          name,
          amount: formatCurrency(amount),
          percent: `${percent}%`,
          barColor: color.bar,
          barWidthPercent: percent,
        };
      });
  }, [monthWindow.end, monthWindow.start, resolvedBudget, subcategories, transactions]);

  if (isBudgetsLoading && !resolvedBudget) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white px-5">
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      </div>
    );
  }

  if (!resolvedBudget) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white px-5">
        <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
      </div>
    );
  }

  const budgetLimit = resolvedBudget.limitAmount;
  const percent = progressPercent ?? clampPercent((spentAmount / budgetLimit) * 100);
  const remaining = Math.max(0, budgetLimit - spentAmount);

  const resolvedBudgetName = budgetName ?? resolvedBudget.name;
  const resolvedBudgetIcon = budgetIcon ?? categoryMeta?.icon ?? "tag";
  const resolvedBudgetDescription = budgetDescription ?? "Seguimiento mensual";

  const progressTextColor = progressColor.replace("bg-", "text-");

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <BudgetHero
        headerBg={headerBg}
        icon={resolvedBudgetIcon}
        name={resolvedBudgetName}
        description={resolvedBudgetDescription}
        spentLabel={spentLabel}
        spentValue={spentValue ?? `${formatCurrency(spentAmount)} / ${formatCurrency(budgetLimit)}`}
        percentBadgeText={percentBadgeText ?? `${percent}% del budget`}
        onBackClick={onBackClick}
        onEditClick={onEditClick}
      />

      <div className="flex flex-col gap-2 px-5 pt-5">
        <ProgressSection
          percent={percent}
          barColor={progressColor}
          barHeight="h-2.5"
          leftLabel={progressUsedLabel ?? `${percent}% usado`}
          rightLabel={progressRemainingLabel ?? `${formatCurrency(remaining)} restante`}
          leftLabelClassName={`text-xs font-semibold ${progressTextColor}`}
          rightLabelClassName="text-xs font-medium text-[#71717A]"
        />
      </div>

      <div className="flex-1 overflow-auto p-5">
        <CardSection
          title={subcategoriesTitle}
          action={
            <button
              type="button"
              onClick={onAddSubcategory}
              className="flex items-center gap-1.5 bg-[#F4F4F5] rounded-xl px-3 py-2"
              aria-label={addSubLabel}
            >
              <PhosphorIcon name="plus" size="text-[16px]" className="text-black" />
              <TextBadge
                text={addSubLabel}
                bg=""
                textColor="text-black"
                padding=""
                rounded=""
                fontSize="text-xs"
                fontWeight="font-semibold"
              />
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            {detailSubcategories.length === 0 && (
              <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
            )}

            {detailSubcategories.map((sub) => (
              <CategoryItem
                key={sub.name}
                dotColor={sub.dotColor}
                name={sub.name}
                value={sub.amount}
                secondaryValue={sub.percent}
                nameClassName="text-[15px] font-semibold text-black font-['Outfit']"
                valueClassName="text-[15px] font-bold text-black font-['Outfit']"
                secondaryClassName="text-xs font-medium text-[#71717A]"
                progress={{
                  percent: sub.barWidthPercent,
                  barColor: sub.barColor,
                  trackColor: "bg-[#E4E4E7]",
                  barHeight: "h-1.5",
                }}
                containerClassName="bg-[#F4F4F5] rounded-2xl p-4"
              />
            ))}
          </div>
        </CardSection>
      </div>
    </div>
  );
}
