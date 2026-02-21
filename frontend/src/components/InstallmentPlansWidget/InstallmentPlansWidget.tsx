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
      titleClassName="text-lg font-bold text-[var(--text-primary)] font-['Outfit']"
      gap="gap-3"
      action={(
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-medium text-[var(--text-secondary)]"
        >
          {viewAllLabel}
        </button>
      )}
    >
      {isLoading && cuotas.length === 0 && (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
      )}

      {!isLoading && hasError && (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
      )}

      {!isLoading && !hasError && showEmpty && (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
      )}

      {cuotas.map((cuota) => (
        <ListItemRow
          key={cuota.name}
          left={<></>}
          title={cuota.name}
          subtitle={cuota.progressLabel}
          titleClassName="text-base font-semibold text-[var(--text-primary)] font-['Outfit']"
          subtitleClassName="text-[13px] font-medium text-[var(--text-secondary)]"
          right={<span className="text-xl font-bold text-[var(--text-primary)] font-['Outfit']">{cuota.amount}</span>}
          padding="p-4"
          className="bg-[var(--surface-muted)] rounded-2xl"
          gap="gap-0"
        />
      ))}
    </CardSection>
  );
}
