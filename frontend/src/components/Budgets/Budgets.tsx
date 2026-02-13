import { useMemo, useState } from "react";
import type { NavItem } from "@/types";
import {
  ActionButton,
  BottomNavigation,
  CardSection,
  IconBadge,
  PageHeader,
  ProgressSection,
  StatDisplay,
  SummaryPanel,
  TextBadge,
} from "@/components";
import { useBudgets, useCategories, useTransactions } from "@/hooks";
import {
  formatCurrency,
  getCurrentMonthWindow,
  getTransactionDateForMonthBalance,
} from "@/utils";

export interface BudgetsProps {
  avatarInitials?: string;
  headerTitle?: string;
  summaryTitle?: string;
  summaryLeftLabel?: string;
  summaryRightLabel?: string;
  summaryProgressLabel?: string;
  sectionTitle?: string;
  quickAddTitle?: string;
  quickAddCategoryLabel?: string;
  quickAddAmountLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddAmountErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  navItems?: NavItem[];
  onAddClick?: () => void;
  onBudgetClick?: (index: number) => void;
  onNavItemClick?: (index: number) => void;
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

const formatMonthLabel = (yearMonth: string): string => {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const formatted = YEAR_MONTH_FORMATTER.format(date);
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
};

export function Budgets({
  avatarInitials = "JS",
  headerTitle = "Budgets",
  summaryTitle = "RESUMEN DE PRESUPUESTO",
  summaryLeftLabel = "Total Gastado",
  summaryRightLabel = "Presupuesto Total",
  summaryProgressLabel = "usado",
  sectionTitle = "Mis Budgets",
  quickAddTitle = "Nuevo budget",
  quickAddCategoryLabel = "Categoría",
  quickAddAmountLabel = "Monto límite",
  quickAddSubmitLabel = "Guardar budget",
  quickAddAmountErrorLabel = "Ingresa un monto mayor a 0.",
  loadingLabel = "Cargando budgets...",
  emptyTitle = "No hay budgets",
  emptyHint = "Agrega un budget para empezar a organizar tus gastos.",
  errorLabel = "No pudimos cargar los budgets. Intenta nuevamente.",
  navItems = [
    { icon: "house", label: "Home" },
    { icon: "wallet", label: "Budgets", active: true },
    { icon: "chart-bar", label: "Statistics" },
    { icon: "trend-up", label: "Inversiones" },
    { icon: "dots-three", label: "Más" },
  ],
  onAddClick,
  onBudgetClick,
  onNavItemClick,
}: BudgetsProps) {
  const {
    items: budgets,
    isLoading,
    error,
    create,
  } = useBudgets();
  const { items: categories } = useCategories();
  const { items: transactions } = useTransactions();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [limitAmountInput, setLimitAmountInput] = useState<string>("");
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const currentMonthWindow = useMemo(() => getCurrentMonthWindow(), []);
  const currentMonth = useMemo(() => {
    const year = currentMonthWindow.start.getFullYear();
    const month = String(currentMonthWindow.start.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, [currentMonthWindow]);

  const categoryById = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; iconBg: string }>();
    categories.forEach((category) => {
      map.set(category.id, {
        name: category.name,
        icon: category.icon,
        iconBg: category.iconBg,
      });
    });
    return map;
  }, [categories]);

  const expensesByCategoryId = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((transaction) => {
      const transactionDate = getTransactionDateForMonthBalance(transaction);
      if (!transactionDate) {
        return;
      }

      if (
        transactionDate < currentMonthWindow.start ||
        transactionDate >= currentMonthWindow.end
      ) {
        return;
      }

      const amount = parseSignedAmount(transaction.amount);
      if (amount >= 0 || !transaction.categoryId) {
        return;
      }

      map.set(transaction.categoryId, (map.get(transaction.categoryId) ?? 0) + Math.abs(amount));
    });

    return map;
  }, [currentMonthWindow, transactions]);

  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.month === currentMonth),
    [budgets, currentMonth],
  );

  const summary = useMemo(() => {
    const totalBudget = visibleBudgets.reduce((sum, item) => sum + item.limitAmount, 0);
    const totalSpent = visibleBudgets.reduce(
      (sum, item) => sum + (expensesByCategoryId.get(item.categoryId) ?? 0),
      0,
    );
    const progress = totalBudget > 0 ? clampPercent((totalSpent / totalBudget) * 100) : 0;

    return {
      totalBudget,
      totalSpent,
      progress,
    };
  }, [expensesByCategoryId, visibleBudgets]);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.name.localeCompare(right.name)),
    [categories],
  );

  const limitAmountValue = Number(limitAmountInput);
  const isAmountValid = Number.isFinite(limitAmountValue) && limitAmountValue > 0;
  const isCategoryValid = selectedCategoryId.length > 0;
  const isFormValid = isAmountValid && isCategoryValid;

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      setIsEditorOpen(false);
      setSelectedCategoryId("");
      setLimitAmountInput("");
      setShowValidation(false);
    } else {
      setIsEditorOpen(true);
      setShowValidation(false);
    }

    onAddClick?.();
  };

  const handleCreate = async () => {
    setShowValidation(true);
    if (!isFormValid) {
      return;
    }

    const selectedCategory = categoryById.get(selectedCategoryId);
    const created = await create({
      categoryId: selectedCategoryId,
      name: selectedCategory?.name ?? "Uncategorized",
      limitAmount: limitAmountValue,
      month: currentMonth,
    });

    if (!created) {
      return;
    }

    setIsEditorOpen(false);
    setSelectedCategoryId("");
    setLimitAmountInput("");
    setShowValidation(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-4 py-5">
          {isEditorOpen && (
            <div className="px-5">
              <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
                  {quickAddTitle}
                </span>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#52525B]">{quickAddCategoryLabel}</span>
                  <select
                    value={selectedCategoryId}
                    onChange={(event) => setSelectedCategoryId(event.target.value)}
                    className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                  >
                    <option value="">Selecciona una categoría</option>
                    {sortedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[#52525B]">{quickAddAmountLabel}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={limitAmountInput}
                    onChange={(event) => setLimitAmountInput(event.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                  />
                  {showValidation && !isAmountValid && (
                    <span className="text-[11px] font-medium text-[#71717A]">
                      {quickAddAmountErrorLabel}
                    </span>
                  )}
                </label>

                <ActionButton
                  icon="plus"
                  label={quickAddSubmitLabel}
                  iconColor="text-white"
                  labelColor="text-white"
                  bg={isFormValid && !isLoading ? "bg-black" : "bg-[#A1A1AA]"}
                  padding="px-4 py-3"
                  className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
                  onClick={() => {
                    void handleCreate();
                  }}
                />
              </div>
            </div>
          )}

          <SummaryPanel title={summaryTitle}>
            <div className="flex justify-between w-full">
              <StatDisplay label={summaryLeftLabel} value={formatCurrency(summary.totalSpent)} />
              <StatDisplay label={summaryRightLabel} value={formatCurrency(summary.totalBudget)} align="end" />
            </div>
            <ProgressSection
              percent={summary.progress}
              barColor="bg-[#10B981]"
              trackColor="bg-[#3F3F46]"
              leftLabel={`${summary.progress}% ${summaryProgressLabel}`}
              leftLabelClassName="text-xs font-normal text-[#10B981]"
            />
          </SummaryPanel>

          <CardSection
            title={sectionTitle}
            titleClassName="text-lg font-bold text-black font-['Outfit']"
            className="px-5"
          >
            {isLoading && visibleBudgets.length === 0 && (
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            )}

            {!isLoading && error && (
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            )}

            {!isLoading && !error && visibleBudgets.length === 0 && (
              <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
                <span className="block text-sm font-semibold text-black font-['Outfit']">{emptyTitle}</span>
                <span className="block text-xs font-medium text-[#71717A] mt-1">{emptyHint}</span>
              </div>
            )}

            {visibleBudgets.map((budget, index) => {
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
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <IconBadge
                        icon={categoryMeta?.icon ?? "tag"}
                        bg={categoryMeta?.iconBg ?? "bg-[#18181B]"}
                        size="w-[40px] h-[40px]"
                        rounded="rounded-[20px]"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-semibold text-[#18181B] font-['Outfit']">
                          {budget.name}
                        </span>
                        <span className="text-xs font-normal text-[#71717A]">
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
        </div>
      </div>
      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
