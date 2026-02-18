import { ProgressSection, StatDisplay } from "@/components";
import { formatCurrency, type CuotaPlanItem } from "@/utils";

export interface PlansListWidgetProps {
  cuotaLabel?: string;
  deleteActionLabel?: string;
  deleteCancelLabel?: string;
  deleteConfirmHint?: string;
  deleteConfirmLabel?: string;
  deleteConfirmPlanId?: string | null;
  deleteConfirmTitle?: string;
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  invalidDateErrorLabel?: string;
  invalidDatePlanId?: string | null;
  isLoading?: boolean;
  items?: CuotaPlanItem[];
  loadingLabel?: string;
  markInstallmentAriaLabel?: string;
  onDeleteConfirmPlanIdChange?: (value: string | null) => void;
  onDeletePlan?: (id: string) => void;
  onMarkInstallmentPaid?: (id: string) => void;
  onPlanClick?: (index: number) => void;
  paidFeedbackPlanId?: string | null;
  pendingPaidPlanId?: string | null;
  totalLabel?: string;
}

export function PlansListWidget({
  cuotaLabel = "Cuota mensual",
  deleteActionLabel = "Eliminar",
  deleteCancelLabel = "Cancelar",
  deleteConfirmHint = "No se puede deshacer.",
  deleteConfirmLabel = "Eliminar",
  deleteConfirmPlanId = null,
  deleteConfirmTitle = "¿Eliminar este plan?",
  emptyHint = "Agrega una cuota para ver el pendiente mensual.",
  emptyTitle = "No hay cuotas activas",
  errorLabel = "No pudimos cargar las cuotas. Intenta nuevamente.",
  hasError = false,
  invalidDateErrorLabel = "Fecha inválida",
  invalidDatePlanId = null,
  isLoading = false,
  items = [],
  loadingLabel = "Cargando cuotas...",
  markInstallmentAriaLabel = "Marcar cuota como pagada",
  onDeleteConfirmPlanIdChange,
  onDeletePlan,
  onMarkInstallmentPaid,
  onPlanClick,
  paidFeedbackPlanId = null,
  pendingPaidPlanId = null,
  totalLabel = "Costo total",
}: PlansListWidgetProps) {
  return (
    <>
      {isLoading && items.length === 0 && (
        <div className="rounded-[20px] p-5 bg-[#F4F4F5]">
          <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
        </div>
      )}

      {!isLoading && hasError && (
        <div className="rounded-[20px] p-5 bg-[#F4F4F5]">
          <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
        </div>
      )}

      {!hasError && items.map((cuota, index) => {
        const progressPercent =
          (cuota.paidInstallmentsCount / cuota.installmentsCount) * 100;
        const isFinished = cuota.paidInstallmentsCount >= cuota.installmentsCount;
        const isPending = pendingPaidPlanId === cuota.id;
        const isPaidFeedbackVisible = paidFeedbackPlanId === cuota.id;
        const isInvalidDate = invalidDatePlanId === cuota.id;

        const badgeClassName = isPending
          ? "bg-[#3F3F46] text-white animate-pulse cursor-wait"
          : isInvalidDate
            ? "bg-[#FEE2E2] text-[#B91C1C] ring-2 ring-[#FCA5A5]"
          : isPaidFeedbackVisible
            ? "bg-[#16A34A] text-white ring-2 ring-[#86EFAC]"
            : isFinished
              ? "bg-[#18181B] text-white opacity-80"
              : "bg-black text-white hover:bg-[#27272A] active:scale-[0.98]";
        const isMarkInstallmentEnabled = !isPending && !isFinished;
        const isCardClickable = Boolean(onPlanClick);
        const isDeleteConfirmOpen = deleteConfirmPlanId === cuota.id;

        return (
          <div
            key={cuota.id}
            role={isCardClickable ? "button" : undefined}
            tabIndex={isCardClickable ? 0 : undefined}
            onClick={() => onPlanClick?.(index)}
            onKeyDown={(event) => {
              if (!isCardClickable) {
                return;
              }

              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPlanClick?.(index);
              }
            }}
            className={`flex flex-col gap-4 rounded-[20px] p-5 text-left bg-[#F4F4F5] ${isCardClickable ? "cursor-pointer" : ""}`}
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

              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  aria-label={markInstallmentAriaLabel}
                  disabled={!isMarkInstallmentEnabled}
                  onClick={(event) => {
                    event.stopPropagation();
                    onMarkInstallmentPaid?.(cuota.id);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-sm font-bold transition-all duration-1000 ease-out ${badgeClassName}`}
                >
                  {cuota.paidInstallmentsCount}/{cuota.installmentsCount}
                </button>
                {isInvalidDate && (
                  <span className="text-[10px] font-medium text-[#B91C1C]">
                    {invalidDateErrorLabel}
                  </span>
                )}
              </div>
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

            <div className="flex justify-end">
              {!isDeleteConfirmOpen ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteConfirmPlanIdChange?.(cuota.id);
                  }}
                  className="text-xs font-medium text-[#71717A]"
                >
                  {deleteActionLabel}
                </button>
              ) : (
                <div
                  className="rounded-xl bg-white px-3 py-3 flex flex-col gap-2 max-w-[280px]"
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  <span className="text-xs font-semibold text-black">{deleteConfirmTitle}</span>
                  <span className="text-xs font-medium text-[#71717A]">{deleteConfirmHint}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDeleteConfirmPlanIdChange?.(null)}
                      className="px-3 py-1.5 rounded-lg bg-[#F4F4F5] text-xs font-medium text-[#52525B]"
                    >
                      {deleteCancelLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePlan?.(cuota.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#E4E4E7] text-xs font-medium text-[#18181B]"
                    >
                      {deleteConfirmLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!isLoading && !hasError && items.length === 0 && (
        <div className="rounded-[20px] p-5 bg-[#F4F4F5]">
          <span className="block text-base font-semibold text-black font-['Outfit']">
            {emptyTitle}
          </span>
          <span className="block mt-1 text-xs font-medium text-[#71717A]">
            {emptyHint}
          </span>
        </div>
      )}
    </>
  );
}
