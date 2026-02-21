import { CardSection } from "@/components";
import { formatCurrency } from "@/utils";

export interface AccountsSummaryWidgetProps {
  summaryTitle?: string;
  totalBalance?: number;
}

export function AccountsSummaryWidget({
  summaryTitle = "Balance total",
  totalBalance = 0,
}: AccountsSummaryWidgetProps) {
  return (
    <CardSection
      title={summaryTitle}
      titleClassName="text-base font-bold text-[var(--text-primary)] font-['Outfit']"
      className="rounded-2xl bg-[var(--surface-muted)] p-4"
    >
      <span className="block text-[clamp(1.5rem,8vw,2rem)] font-bold text-[var(--text-primary)] font-['Outfit']">
        {formatCurrency(totalBalance)}
      </span>
    </CardSection>
  );
}
