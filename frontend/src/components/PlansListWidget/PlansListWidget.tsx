import { ProgressSection, StatDisplay, TextBadge } from "@/components";
import { formatCurrency, type CuotaPlanItem } from "@/utils";

export interface PlansListWidgetProps {
  cuotaLabel?: string;
  emptyHint?: string;
  emptyTitle?: string;
  errorLabel?: string;
  hasError?: boolean;
  isLoading?: boolean;
  items?: CuotaPlanItem[];
  loadingLabel?: string;
  onPlanClick?: (index: number) => void;
  totalLabel?: string;
}

export function PlansListWidget({
  cuotaLabel = "Cuota mensual",
  emptyHint = "Agrega una cuota para ver el pendiente mensual.",
  emptyTitle = "No hay cuotas activas",
  errorLabel = "No pudimos cargar las cuotas. Intenta nuevamente.",
  hasError = false,
  isLoading = false,
  items = [],
  loadingLabel = "Cargando cuotas...",
  onPlanClick,
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
