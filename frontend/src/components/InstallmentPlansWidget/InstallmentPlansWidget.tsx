import type { CuotaItem } from "@/types";
import { CardSection, ListItemRow } from "@/components";

export interface InstallmentPlansWidgetProps {
  cuotas: CuotaItem[];
  emptyLabel: string;
  errorLabel: string;
  hasError: boolean;
  isLoading: boolean;
  loadingLabel: string;
  onViewAll?: () => void;
  showEmpty: boolean;
  title: string;
  viewAllLabel: string;
}

export function InstallmentPlansWidget({
  cuotas,
  emptyLabel,
  errorLabel,
  hasError,
  isLoading,
  loadingLabel,
  onViewAll,
  showEmpty,
  title,
  viewAllLabel,
}: InstallmentPlansWidgetProps) {
  return (
    <CardSection
      title={title}
      titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
      className="rounded-[24px] bg-[#F4F4F5] p-4"
      action={(
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-[#71717A]"
        >
          {viewAllLabel}
        </button>
      )}
    >
      {isLoading && cuotas.length === 0 && (
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      )}

      {!isLoading && hasError && (
        <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
      )}

      {!isLoading && !hasError && showEmpty && (
        <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
      )}

      {cuotas.map((cuota) => (
        <ListItemRow
          key={cuota.name}
          left={<></>}
          title={cuota.name}
          subtitle={cuota.progressLabel}
          titleClassName="text-base font-semibold text-black font-['Outfit']"
          subtitleClassName="text-[13px] font-medium text-[#71717A]"
          right={<span className="text-xl font-bold text-black font-['Outfit']">{cuota.amount}</span>}
          padding="p-4"
          className="bg-[#F4F4F5] rounded-2xl"
          gap="gap-0"
        />
      ))}
    </CardSection>
  );
}
