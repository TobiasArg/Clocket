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

export function SpendingInfoWidget({
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
      titleClassName="text-2xl font-extrabold text-black font-['Outfit']"
      className="rounded-[24px] bg-[#F4F4F5] p-4"
      action={(
        <div className="flex flex-col items-end">
          <span className="text-xl font-light text-[#71717A] font-['Outfit']">
            {total}
          </span>
          <span className="text-[11px] font-medium text-[#A1A1AA]">
            {pendingInstallmentsLabel}
            {": "}
            {pendingInstallmentsValue}
          </span>
        </div>
      )}
    >
      {isLoading && categories.length === 0 && (
        <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
      )}

      {!isLoading && showEmpty && (
        <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
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
}
