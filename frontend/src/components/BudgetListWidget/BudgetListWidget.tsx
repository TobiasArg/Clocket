import { CardSection } from "@/components";
import { IconBadge } from "../IconBadge/IconBadge";
import {
  formatCurrency,
  getPrimaryBudgetCategoryId,
  type BudgetPlanItem,
} from "@/utils";
import type { BudgetCategoryMeta } from "@/hooks";

export interface BudgetListWidgetProps {
  categoryById: Map<string, BudgetCategoryMeta>;
  emptyActionLabel: string;
  emptyHint: string;
  emptyTitle: string;
  errorLabel: string;
  errorMessage: string | null;
  expensesByBudgetId: Map<string, number>;
  items: BudgetPlanItem[];
  isLoading: boolean;
  loadingLabel: string;
  onBudgetClick?: (budgetId: string) => void;
  onEmptyAction?: () => void;
  sectionTitle: string;
}

const DEFAULT_ACCENT_COLOR = "#2563EB";

const YEAR_MONTH_FORMATTER = new Intl.DateTimeFormat("es-ES", {
  month: "long",
  year: "numeric",
});

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const formatMonthLabel = (yearMonth: string): string => {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const formatted = YEAR_MONTH_FORMATTER.format(date);
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
};

const resolveCssColorFromBgClass = (bgClass: string | undefined): string | null => {
  if (!bgClass) {
    return null;
  }

  const match = bgClass.trim().match(/^bg-\[(.+)\]$/);
  if (!match) {
    return null;
  }

  return match[1]?.trim() || null;
};

export function BudgetListWidget({
  categoryById,
  emptyActionLabel,
  emptyHint,
  emptyTitle,
  errorLabel,
  errorMessage,
  expensesByBudgetId,
  items,
  isLoading,
  loadingLabel,
  onBudgetClick,
  onEmptyAction,
  sectionTitle,
}: BudgetListWidgetProps) {
  const showLoading = isLoading && items.length === 0;

  return (
    <CardSection
      title={sectionTitle}
      titleClassName="block min-w-0 truncate text-[clamp(1.05rem,4.4vw,1.2rem)] font-bold text-[var(--text-primary)] font-['Outfit']"
      className="px-5"
    >
      {showLoading && (
        <span className="block text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
      )}

      {!showLoading && errorMessage && (
        <span className="block text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
      )}

      {!showLoading && !errorMessage && items.length === 0 && (
        <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
          <span className="block truncate text-sm font-semibold text-[var(--text-primary)] font-['Outfit']">{emptyTitle}</span>
          <span className="mt-1 block text-xs font-medium text-[var(--text-secondary)]">{emptyHint}</span>
          {onEmptyAction && (
            <button
              type="button"
              onClick={onEmptyAction}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-[var(--text-primary)] px-3 py-2 text-xs font-semibold text-[var(--panel-bg)]"
            >
              {emptyActionLabel}
            </button>
          )}
        </div>
      )}

      {items.map((budget) => {
        const spentAmount = expensesByBudgetId.get(budget.id) ?? 0;
        const rawPercent = budget.limitAmount > 0
          ? Math.round((spentAmount / budget.limitAmount) * 100)
          : 0;
        const percent = budget.limitAmount > 0
          ? clampPercent(rawPercent)
          : 0;
        const overspentAmount = Math.max(0, spentAmount - budget.limitAmount);
        const isOverBudget = overspentAmount > 0;

        const primaryCategoryId = getPrimaryBudgetCategoryId(budget.scopeRules, budget.categoryId);
        const categoryMeta = primaryCategoryId ? categoryById.get(primaryCategoryId) : undefined;
        const accentColor = resolveCssColorFromBgClass(categoryMeta?.iconBg) ?? DEFAULT_ACCENT_COLOR;

        return (
          <button
            key={budget.id}
            type="button"
            onClick={() => onBudgetClick?.(budget.id)}
            className="flex flex-col gap-4 bg-[var(--surface-muted)] rounded-[20px] p-5 text-left"
          >
            <div className="flex min-w-0 items-center justify-between w-full gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <IconBadge
                  icon={categoryMeta?.icon ?? "tag"}
                  bg={categoryMeta?.iconBg ?? "bg-[var(--text-primary)]"}
                  size="w-[40px] h-[40px]"
                  rounded="rounded-[20px]"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="block truncate text-[clamp(0.95rem,3.8vw,1.05rem)] font-semibold text-[var(--text-primary)] font-['Outfit']">
                    {budget.name}
                  </span>
                  <span className="block truncate text-[11px] font-normal text-[var(--text-secondary)]">
                    Meta: {formatMonthLabel(budget.month)}
                  </span>
                </div>
              </div>
              <div className="inline-flex shrink-0 items-center rounded-[10px] border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-1.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: accentColor }}
                >
                  {`${isOverBudget ? rawPercent : percent}%`}
                </span>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="h-2 w-full overflow-hidden rounded bg-[var(--surface-border)]">
                <div
                  className="h-full rounded transition-[width] duration-200 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
              <div className="flex justify-between w-full">
                <span className="block max-w-[48%] truncate text-sm font-semibold text-[var(--text-primary)] font-['Outfit']">
                  {formatCurrency(spentAmount)}
                </span>
                <span className="block max-w-[48%] truncate text-right text-sm font-normal text-[var(--text-secondary)]">
                  {formatCurrency(budget.limitAmount)}
                </span>
              </div>
            </div>
            {isOverBudget && (
              <span className="block truncate text-xs font-semibold text-[#B91C1C]">
                Excedido por {formatCurrency(overspentAmount)}
              </span>
            )}
          </button>
        );
      })}
    </CardSection>
  );
}
