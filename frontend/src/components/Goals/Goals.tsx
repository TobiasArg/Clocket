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
import { useGoals } from "@/hooks";
import { formatCurrency } from "@/utils";

export interface GoalsProps {
  avatarInitials?: string;
  headerTitle?: string;
  summaryTitle?: string;
  totalLabel?: string;
  goalLabel?: string;
  progressLabel?: string;
  sectionTitle?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddTargetAmountLabel?: string;
  quickAddSavedAmountLabel?: string;
  quickAddTargetMonthLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddNameErrorLabel?: string;
  quickAddTargetErrorLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  deleteActionLabel?: string;
  navItems?: NavItem[];
  onAddClick?: () => void;
  onNavItemClick?: (index: number) => void;
}

const GOAL_ICONS = ["airplane-tilt", "device-mobile", "target", "piggy-bank"] as const;

const getCurrentYearMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (yearMonth: string): string => {
  const [year, month] = yearMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const formatter = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });
  const formatted = formatter.format(date);
  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
};

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const getProgressStyles = (percent: number) => {
  if (percent >= 70) {
    return {
      percentColor: "text-[#10B981]",
      percentBg: "bg-[#D1FAE5]",
      barColor: "bg-[#10B981]",
    };
  }

  if (percent >= 40) {
    return {
      percentColor: "text-[#D97706]",
      percentBg: "bg-[#FEF3C7]",
      barColor: "bg-[#D97706]",
    };
  }

  return {
    percentColor: "text-[#DC2626]",
    percentBg: "bg-[#FEE2E2]",
    barColor: "bg-[#DC2626]",
  };
};

export function Goals({
  avatarInitials = "JS",
  headerTitle = "Goals",
  summaryTitle = "RESUMEN DE AHORRO",
  totalLabel = "Total Ahorrado",
  goalLabel = "Meta Total",
  progressLabel = "completado",
  sectionTitle = "Mis Goals",
  quickAddTitle = "Nueva meta",
  quickAddNameLabel = "Nombre",
  quickAddTargetAmountLabel = "Meta",
  quickAddSavedAmountLabel = "Ahorrado",
  quickAddTargetMonthLabel = "Mes objetivo",
  quickAddSubmitLabel = "Guardar meta",
  quickAddNameErrorLabel = "Agrega un nombre corto.",
  quickAddTargetErrorLabel = "La meta debe ser mayor a 0.",
  loadingLabel = "Cargando metas...",
  emptyTitle = "No hay metas",
  emptyHint = "Agrega una meta para empezar a ahorrar con foco.",
  errorLabel = "No pudimos cargar las metas. Intenta nuevamente.",
  deleteActionLabel = "Delete",
  navItems = [
    { icon: "house", label: "Home", to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-pie-slice", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", to: "/investments" },
    { icon: "dots-three-outline", label: "Más", active: true, to: "/more" },
  ],
  onAddClick,
  onNavItemClick,
}: GoalsProps) {
  const { items, isLoading, error, create, remove } = useGoals();

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>("");
  const [targetAmountInput, setTargetAmountInput] = useState<string>("");
  const [savedAmountInput, setSavedAmountInput] = useState<string>("");
  const [targetMonthInput, setTargetMonthInput] = useState<string>(getCurrentYearMonth);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const targetAmountValue = Number(targetAmountInput);
  const savedAmountValue = Number(savedAmountInput || "0");
  const normalizedTitle = titleInput.trim();

  const isTitleValid = normalizedTitle.length > 0;
  const isTargetValid = Number.isFinite(targetAmountValue) && targetAmountValue > 0;
  const isSavedValid = Number.isFinite(savedAmountValue) && savedAmountValue >= 0;
  const isFormValid = isTitleValid && isTargetValid && isSavedValid;

  const summary = useMemo(() => {
    const totalSaved = items.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalTarget = items.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const percent = totalTarget > 0 ? clampPercent((totalSaved / totalTarget) * 100) : 0;
    return { totalSaved, totalTarget, percent };
  }, [items]);

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      setIsEditorOpen(false);
      setTitleInput("");
      setTargetAmountInput("");
      setSavedAmountInput("");
      setTargetMonthInput(getCurrentYearMonth());
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

    const created = await create({
      title: normalizedTitle,
      targetAmount: targetAmountValue,
      savedAmount: savedAmountValue,
      targetMonth: targetMonthInput,
    });

    if (!created) {
      return;
    }

    setIsEditorOpen(false);
    setTitleInput("");
    setTargetAmountInput("");
    setSavedAmountInput("");
    setTargetMonthInput(getCurrentYearMonth());
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
        {isEditorOpen && (
          <div className="px-5 pb-2">
            <div className="flex flex-col gap-3 bg-[#F4F4F5] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
                {quickAddTitle}
              </span>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddNameLabel}</span>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(event) => setTitleInput(event.target.value)}
                  placeholder="Ej. Vacaciones"
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isTitleValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">{quickAddNameErrorLabel}</span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddTargetAmountLabel}</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={targetAmountInput}
                  onChange={(event) => setTargetAmountInput(event.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isTargetValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">{quickAddTargetErrorLabel}</span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddSavedAmountLabel}</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={savedAmountInput}
                  onChange={(event) => setSavedAmountInput(event.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddTargetMonthLabel}</span>
                <input
                  type="month"
                  value={targetMonthInput}
                  onChange={(event) => setTargetMonthInput(event.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
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
            <StatDisplay label={totalLabel} value={formatCurrency(summary.totalSaved)} />
            <StatDisplay label={goalLabel} value={formatCurrency(summary.totalTarget)} align="end" />
          </div>
          <ProgressSection
            percent={summary.percent}
            barColor="bg-[#10B981]"
            trackColor="bg-[#3F3F46]"
            leftLabel={`${summary.percent}% ${progressLabel}`}
            leftLabelClassName="text-xs font-normal text-[#10B981]"
          />
        </SummaryPanel>

        <CardSection
          title={sectionTitle}
          titleClassName="text-lg font-bold text-black font-['Outfit']"
          className="p-5"
        >
          {isLoading && items.length === 0 && (
            <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
          )}

          {!isLoading && error && (
            <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
          )}

          {!isLoading && !error && items.length === 0 && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="block text-sm font-semibold text-black font-['Outfit']">{emptyTitle}</span>
              <span className="block text-xs font-medium text-[#71717A] mt-1">{emptyHint}</span>
            </div>
          )}

          {items.map((goal, index) => {
            const percent = goal.targetAmount > 0
              ? clampPercent((goal.savedAmount / goal.targetAmount) * 100)
              : 0;
            const styles = getProgressStyles(percent);

            return (
              <div key={goal.id} className="flex flex-col gap-4 bg-[#F4F4F5] rounded-[20px] p-5">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <IconBadge
                      icon={GOAL_ICONS[index % GOAL_ICONS.length]}
                      size="w-[48px] h-[48px]"
                      rounded="rounded-[14px]"
                      iconSize="text-2xl"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-semibold text-black font-['Outfit']">{goal.title}</span>
                      <span className="text-xs font-normal text-[#71717A]">
                        Meta: {formatMonthLabel(goal.targetMonth)}
                      </span>
                    </div>
                  </div>
                  <TextBadge
                    text={`${percent}%`}
                    bg={styles.percentBg}
                    textColor={styles.percentColor}
                    rounded="rounded-[10px]"
                    fontWeight="font-semibold"
                  />
                </div>
                <ProgressSection
                  percent={percent}
                  barColor={styles.barColor}
                  trackColor="bg-[#E4E4E7]"
                  leftLabel={formatCurrency(goal.savedAmount)}
                  rightLabel={formatCurrency(goal.targetAmount)}
                  leftLabelClassName="text-sm font-semibold text-black font-['Outfit']"
                  rightLabelClassName="text-sm font-normal text-[#71717A]"
                />
                <button
                  type="button"
                  onClick={() => {
                    void remove(goal.id);
                  }}
                  className="w-fit text-xs font-medium text-[#71717A]"
                >
                  {deleteActionLabel}
                </button>
              </div>
            );
          })}
        </CardSection>
      </div>
      <BottomNavigation
        items={navItems}
        activeColor="text-[#10B981]"
        onItemClick={onNavItemClick}
      />
    </div>
  );
}
