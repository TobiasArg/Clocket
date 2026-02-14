import type { DonutSegment } from "@/types";
import { CardSection, DonutChart } from "@/components";

export interface StatisticsCategoryWidgetProps {
  categoryTitle?: string;
  categoryTotal?: string;
  categoryTotalLabel?: string;
  donutSegments?: DonutSegment[];
  emptyLabel?: string;
}

export function StatisticsCategoryWidget({
  categoryTitle = "Gastos por Categoría",
  categoryTotal = "$0.00",
  categoryTotalLabel = "Total",
  donutSegments = [],
  emptyLabel = "No hay movimientos este mes.",
}: StatisticsCategoryWidgetProps) {
  return (
    <CardSection
      title={categoryTitle}
      titleClassName="text-base font-bold text-black font-['Outfit']"
      className="bg-[#F4F4F5] rounded-[20px] p-5"
    >
      {donutSegments.length === 0 ? (
        <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
      ) : (
        <DonutChart
          segments={donutSegments}
          centerValue={categoryTotal}
          centerLabel={categoryTotalLabel}
          bgFill="#F4F4F5"
        />
      )}
    </CardSection>
  );
}
