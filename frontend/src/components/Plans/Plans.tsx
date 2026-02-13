import { useMemo, useState } from "react";
import {
  ActionButton,
  PageHeader,
  ProgressSection,
  StatDisplay,
  TextBadge,
} from "@/components";
import { useCuotas } from "@/hooks";
import {
  formatCurrency,
  getCurrentMonthWindow,
  isCuotaActiveInMonth,
} from "@/utils";

export interface PlansProps {
  headerTitle?: string;
  cuotaLabel?: string;
  totalLabel?: string;
  quickAddTitle?: string;
  quickAddNameLabel?: string;
  quickAddTotalAmountLabel?: string;
  quickAddInstallmentsLabel?: string;
  quickAddStartMonthLabel?: string;
  quickAddNamePlaceholder?: string;
  quickAddTotalAmountPlaceholder?: string;
  quickAddInstallmentsPlaceholder?: string;
  quickAddSubmitLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  loadingLabel?: string;
  errorLabel?: string;
  totalAmountErrorLabel?: string;
  installmentsErrorLabel?: string;
  startMonthErrorLabel?: string;
  onBackClick?: () => void;
  onAddClick?: () => void;
  onPlanClick?: (index: number) => void;
}

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const getCurrentMonthInputValue = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export function Plans({
  headerTitle = "Planes de Cuotas",
  cuotaLabel = "Cuota mensual",
  totalLabel = "Costo total",
  quickAddTitle = "Nueva cuota",
  quickAddNameLabel = "Título",
  quickAddTotalAmountLabel = "Monto total",
  quickAddInstallmentsLabel = "Cantidad de cuotas",
  quickAddStartMonthLabel = "Mes de inicio",
  quickAddNamePlaceholder = "Ej. Notebook",
  quickAddTotalAmountPlaceholder = "0.00",
  quickAddInstallmentsPlaceholder = "12",
  quickAddSubmitLabel = "Guardar cuota",
  emptyTitle = "No hay cuotas activas",
  emptyHint = "Agrega una cuota para ver el pendiente mensual.",
  loadingLabel = "Cargando cuotas...",
  errorLabel = "No pudimos cargar las cuotas. Intenta nuevamente.",
  totalAmountErrorLabel = "Ingresa un monto mayor a 0.",
  installmentsErrorLabel = "Usa al menos 1 cuota.",
  startMonthErrorLabel = "Usa formato YYYY-MM.",
  onBackClick,
  onAddClick,
  onPlanClick,
}: PlansProps) {
  const { items, isLoading, error, create } = useCuotas();
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");
  const [totalAmountInput, setTotalAmountInput] = useState<string>("");
  const [installmentsCountInput, setInstallmentsCountInput] = useState<string>("");
  const [startMonthInput, setStartMonthInput] = useState<string>(getCurrentMonthInputValue);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const currentMonthWindow = useMemo(() => getCurrentMonthWindow(), []);

  const activeCuotas = useMemo(
    () => items.filter((item) => isCuotaActiveInMonth(item, currentMonthWindow)),
    [items, currentMonthWindow],
  );

  const totalAmountValue = Number(totalAmountInput);
  const installmentsCountValue = Number(installmentsCountInput);
  const normalizedStartMonth = startMonthInput.trim() || getCurrentMonthInputValue();
  const isTotalAmountValid = Number.isFinite(totalAmountValue) && totalAmountValue > 0;
  const isInstallmentsCountValid =
    Number.isFinite(installmentsCountValue) &&
    Number.isInteger(installmentsCountValue) &&
    installmentsCountValue >= 1;
  const isStartMonthValid = YEAR_MONTH_PATTERN.test(normalizedStartMonth);
  const isFormValid =
    isTotalAmountValid && isInstallmentsCountValid && isStartMonthValid;

  const closeEditor = () => {
    setIsEditorOpen(false);
    setNameInput("");
    setTotalAmountInput("");
    setInstallmentsCountInput("");
    setStartMonthInput(getCurrentMonthInputValue());
    setShowValidation(false);
  };

  const handleHeaderAction = () => {
    if (isEditorOpen) {
      closeEditor();
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
      title: nameInput.trim() || undefined,
      totalAmount: totalAmountValue,
      installmentsCount: installmentsCountValue,
      startMonth: normalizedStartMonth,
    });

    if (!created) {
      return;
    }

    closeEditor();
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        onBackClick={onBackClick}
        onActionClick={handleHeaderAction}
        actionIcon={isEditorOpen ? "x" : "plus"}
      />
      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="flex flex-col gap-4">
          {isEditorOpen && (
            <div className="flex flex-col gap-3 rounded-[20px] p-4 bg-[#F4F4F5]">
              <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
                {quickAddTitle}
              </span>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">{quickAddNameLabel}</span>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  placeholder={quickAddNamePlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">
                  {quickAddTotalAmountLabel}
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={totalAmountInput}
                  onChange={(event) => setTotalAmountInput(event.target.value)}
                  placeholder={quickAddTotalAmountPlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isTotalAmountValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {totalAmountErrorLabel}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">
                  {quickAddInstallmentsLabel}
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={installmentsCountInput}
                  onChange={(event) => setInstallmentsCountInput(event.target.value)}
                  placeholder={quickAddInstallmentsPlaceholder}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isInstallmentsCountValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {installmentsErrorLabel}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#52525B]">
                  {quickAddStartMonthLabel}
                </span>
                <input
                  type="month"
                  value={startMonthInput}
                  onChange={(event) => setStartMonthInput(event.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                />
                {showValidation && !isStartMonthValid && (
                  <span className="text-[11px] font-medium text-[#71717A]">
                    {startMonthErrorLabel}
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
          )}

          {isLoading && items.length === 0 && (
            <div className="rounded-[20px] p-5 bg-[#F4F4F5]">
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-[20px] p-5 bg-[#F4F4F5]">
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            </div>
          )}

          {!error && activeCuotas.map((cuota, index) => {
            const progressPercent =
              (cuota.paidInstallmentsCount / cuota.installmentsCount) * 100;

            return (
              <button
                key={cuota.id}
                type="button"
                onClick={() => onPlanClick?.(index)}
                className="flex flex-col gap-4 rounded-[20px] p-5 text-left bg-[#F4F4F5]"
              >
                <div className="flex justify-between items-start w-full gap-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-lg font-bold text-black font-['Outfit'] truncate">
                      {cuota.title}
                    </span>
                    <span className="text-xs font-medium text-[#71717A] truncate">
                      Inicio {cuota.startMonth}
                    </span>
                  </div>

                  <TextBadge
                    text={`${cuota.paidInstallmentsCount}/${cuota.installmentsCount}`}
                    bg="bg-black"
                    textColor="text-white"
                    rounded="rounded-xl"
                    padding="px-3 py-1.5"
                    fontSize="text-sm"
                    fontWeight="font-bold"
                  />
                </div>

                <ProgressSection
                  percent={progressPercent}
                  barColor="bg-black"
                  trackColor="bg-[#D4D4D8]"
                />

                <div className="flex justify-between w-full">
                  <StatDisplay
                    label={cuotaLabel}
                    value={formatCurrency(cuota.installmentAmount)}
                    labelClassName="text-[11px] font-medium text-[#71717A]"
                    valueClassName="text-xl font-bold font-['Outfit'] text-black"
                    gap="gap-0.5"
                  />
                  <StatDisplay
                    label={totalLabel}
                    value={formatCurrency(cuota.totalAmount)}
                    labelClassName="text-[11px] font-medium text-[#71717A]"
                    valueClassName="text-xl font-bold font-['Outfit'] text-black"
                    gap="gap-0.5"
                    align="end"
                  />
                </div>
              </button>
            );
          })}

          {!isLoading && !error && activeCuotas.length === 0 && (
            <div className="rounded-[20px] p-5 bg-[#F4F4F5]">
              <span className="block text-base font-semibold text-black font-['Outfit']">
                {emptyTitle}
              </span>
              <span className="block mt-1 text-xs font-medium text-[#71717A]">
                {emptyHint}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
