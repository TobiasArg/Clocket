import { CardSection, IconBadge, ProgressSection, TextBadge } from "@/components";
import { formatCurrency, type BudgetPlanItem } from "@/utils";
import type { BudgetCategoryMeta } from "@/hooks";

export interface BudgetListWidgetProps {
  categoryById: Map<string, BudgetCategoryMeta>;
  emptyHint: string;
  emptyTitle: string;
  errorLabel: string;
  errorMessage: string | null;
  expensesByCategoryId: Map<string, number>;
  items: BudgetPlanItem[];
  isLoading: boolean;
  loadingLabel: string;
  onBudgetClick?: (index: number) => void;
  sectionTitle: string;
}

const BUDGET_COLORS = [
  {
    percentColor: "text-[#DC2626]",
    percentBg: "bg-[#FEE2E2]",
    barColor: "bg-[#DC2626]",
  },
  {
    percentColor: "text-[#2563EB]",
    percentBg: "bg-[#DBEAFE]",
    barColor: "bg-[#2563EB]",
  },
  {
    percentColor: "text-[#7C3AED]",
    percentBg: "bg-[#EDE9FE]",
    barColor: "bg-[#7C3AED]",
  },
  {
    percentColor: "text-[#059669]",
    percentBg: "bg-[#D1FAE5]",
    barColor: "bg-[#059669]",
  },
] as const;

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

export function BudgetListWidget({
  categoryById,
  emptyHint,
  emptyTitle,
  errorLabel,
  errorMessage,
  expensesByCategoryId,
  items,
  isLoading,
  loadingLabel,
  onBudgetClick,
  sectionTitle,
}: BudgetListWidgetProps) {
  const showLoading = isLoading && items.length === 0;

  return (
    <CardSection
      title={sectionTitle}
      titleClassName="text-lg font-bold text-black font-['Outfit']"
      className="px-5"
    >
      {showLoading && (
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      )}

      {!showLoading && errorMessage && (
        <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
      )}

      {!showLoading && !errorMessage && items.length === 0 && (
        <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
          <span className="block text-sm font-semibold text-black font-['Outfit']">{emptyTitle}</span>
          <span className="block text-xs font-medium text-[#71717A] mt-1">{emptyHint}</span>
        </div>
      )}

      {items.map((budget, index) => {
        const spentAmount = expensesByCategoryId.get(budget.categoryId) ?? 0;
        const percent = budget.limitAmount > 0
          ? clampPercent((spentAmount / budget.limitAmount) * 100)
          : 0;
        const colorSet = BUDGET_COLORS[index % BUDGET_COLORS.length];
        const categoryMeta = categoryById.get(budget.categoryId);

        return (
          <button
            key={budget.id}
            type="button"
            onClick={() => onBudgetClick?.(index)}
            className="flex flex-col gap-4 bg-[#F4F4F5] rounded-[20px] p-5 text-left"
          >
            <div className="flex min-w-0 items-center justify-between w-full gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <IconBadge
                  icon={categoryMeta?.icon ?? "tag"}
                  bg={categoryMeta?.iconBg ?? "bg-[#18181B]"}
                  size="w-[40px] h-[40px]"
                  rounded="rounded-[20px]"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="block truncate text-base font-semibold text-[#18181B] font-['Outfit']">
                    {budget.name}
                  </span>
                  <span className="block truncate text-xs font-normal text-[#71717A]">
                    Meta: {formatMonthLabel(budget.month)}
                  </span>
                </div>
              </div>
              <TextBadge
                text={`${percent}%`}
                bg={colorSet.percentBg}
                textColor={colorSet.percentColor}
                rounded="rounded-[10px]"
                fontWeight="font-semibold"
                className="shrink-0"
              />
            </div>
            <ProgressSection
              percent={percent}
              barColor={colorSet.barColor}
              trackColor="bg-[#E4E4E7]"
              leftLabel={formatCurrency(spentAmount)}
              rightLabel={formatCurrency(budget.limitAmount)}
              leftLabelClassName="text-sm font-semibold text-[#18181B] font-['Outfit']"
              rightLabelClassName="text-sm font-normal text-[#71717A]"
            />
          </button>
        );
      })}
    </CardSection>
  );
}
