import { memo } from "react";
import type { SpendingCategory } from "@/types";
import { CardSection, SpendingBar } from "@/components";

export interface SpendingInfoWidgetProps {
  categories: SpendingCategory[];
  emptyLabel: string;
  isLoading: boolean;
  loadingLabel: string;
  pendingInstallmentsLabel: string;
  pendingInstallmentsValue: string;
  showEmpty: boolean;
  title: string;
  total: string;
}

export const SpendingInfoWidget = memo(function SpendingInfoWidget({
  categories,
  emptyLabel,
  isLoading,
  loadingLabel,
  pendingInstallmentsLabel,
  pendingInstallmentsValue,
  showEmpty,
  title,
  total,
}: SpendingInfoWidgetProps) {
  return (
    <CardSection
      title={title}
      titleClassName="text-lg font-bold text-[var(--text-primary)] font-['Outfit']"
      className="clocket-aurora-card rounded-2xl p-4"
      action={(
        <div className="flex flex-col items-end">
          <span className="text-lg font-semibold text-[var(--text-primary)] font-['Outfit']">
            {total}
          </span>
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            {pendingInstallmentsLabel}
            {": "}
            {pendingInstallmentsValue}
          </span>
        </div>
      )}
    >
      {isLoading && categories.length === 0 && (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
      )}

      {!isLoading && showEmpty && (
        <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
      )}

      {categories.map((category) => (
        <SpendingBar
          key={category.label}
          label={category.label}
          percentage={category.percentage}
          barColor={category.color}
        />
      ))}
    </CardSection>
  );
});
