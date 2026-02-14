import type { LegendItem } from "@/types";
import { CardSection, Dot, StatDisplay } from "@/components";

export interface StatisticsBalanceWidgetProps {
  balanceLegend?: LegendItem[];
  balanceTitle?: string;
  totalExpenseColor?: string;
  totalExpenseLabel?: string;
  totalExpenseValue?: string;
  totalIncomeColor?: string;
  totalIncomeLabel?: string;
  totalIncomeValue?: string;
}

export function StatisticsBalanceWidget({
  balanceLegend = [],
  balanceTitle = "Balance Mensual",
  totalExpenseColor = "text-[#DC2626]",
  totalExpenseLabel = "Total Gastos",
  totalExpenseValue = "$0.00",
  totalIncomeColor = "text-[#16A34A]",
  totalIncomeLabel = "Total Ingresos",
  totalIncomeValue = "$0.00",
}: StatisticsBalanceWidgetProps) {
  return (
    <CardSection
      title={balanceTitle}
      titleClassName="text-base font-bold text-black font-['Outfit']"
      action={(
        <div className="flex items-center gap-3">
          {balanceLegend.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <Dot color={item.color} size="w-2 h-2" />
              <span className="text-[10px] font-medium text-[#71717A]">{item.label}</span>
            </div>
          ))}
        </div>
      )}
      className="bg-[#F4F4F5] rounded-[20px] p-5"
    >
      <div className="flex justify-between w-full">
        <StatDisplay
          label={totalIncomeLabel}
          value={totalIncomeValue}
          labelClassName="text-[11px] font-medium text-[#71717A]"
          valueClassName={`text-xl font-bold font-['Outfit'] ${totalIncomeColor}`}
          gap="gap-0.5"
        />
        <StatDisplay
          label={totalExpenseLabel}
          value={totalExpenseValue}
          labelClassName="text-[11px] font-medium text-[#71717A]"
          valueClassName={`text-xl font-bold font-['Outfit'] ${totalExpenseColor}`}
          gap="gap-0.5"
          align="end"
        />
      </div>
    </CardSection>
  );
}
