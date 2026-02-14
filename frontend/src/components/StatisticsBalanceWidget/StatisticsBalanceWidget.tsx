import type { StatisticsFlowDay } from "@/types";
import { memo, useCallback, useMemo, useState } from "react";
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { CardSection } from "../CardSection/CardSection";
import { StatisticsFlowDetailPopup } from "./StatisticsFlowDetailPopup";

export interface StatisticsBalanceWidgetProps {
  balanceTitle?: string;
  emptyLabel?: string;
  flowDays?: StatisticsFlowDay[];
  popupCloseLabel?: string;
  popupExpenseLabel?: string;
  popupIncomeLabel?: string;
}

export const StatisticsBalanceWidget = memo(function StatisticsBalanceWidget({
  balanceTitle = "Flujo",
  emptyLabel = "No hay movimientos en los últimos 7 días.",
  flowDays = [],
  popupCloseLabel = "Cerrar",
  popupExpenseLabel = "Egresos",
  popupIncomeLabel = "Ingresos",
}: StatisticsBalanceWidgetProps) {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const { chartData, dayByKey, expenseSeries, hasFlowData } = useMemo(() => {
    const totalsByCategory = new Map<string, { color: string; total: number }>();
    flowDays.forEach((day) => {
      day.expenseByCategory.forEach((entry) => {
        const current = totalsByCategory.get(entry.category);
        totalsByCategory.set(entry.category, {
          color: current?.color ?? entry.color,
          total: (current?.total ?? 0) + entry.amount,
        });
      });
    });

    const nextExpenseSeries = Array.from(totalsByCategory.entries())
      .sort((left, right) => right[1].total - left[1].total)
      .map(([category, value], index) => ({
        category,
        color: value.color,
        dataKey: `expense_${index}`,
      }));

    const dataKeyByCategory = new Map(nextExpenseSeries.map((series) => [series.category, series.dataKey]));
    const nextChartData = flowDays.map((day) => {
      const row: Record<string, number | string> = {
        income: day.incomeTotal,
        label: day.label,
      };

      nextExpenseSeries.forEach((series) => {
        row[series.dataKey] = 0;
      });
      day.expenseByCategory.forEach((entry) => {
        const dataKey = dataKeyByCategory.get(entry.category);
        if (dataKey) {
          row[dataKey] = -entry.amount;
        }
      });

      return row;
    });

    return {
      chartData: nextChartData,
      dayByKey: new Map(flowDays.map((day) => [day.dateKey, day])),
      expenseSeries: nextExpenseSeries,
      hasFlowData: flowDays.some((day) => day.incomeTotal > 0 || day.expenseTotal > 0),
    };
  }, [flowDays]);

  const selectedDay = selectedDayKey
    ? (dayByKey.get(selectedDayKey) ?? null)
    : null;

  const handleBarClick = useCallback((_entry: unknown, index: number) => {
    const clickedDay = flowDays[index];
    if (!clickedDay) {
      return;
    }

    setSelectedDayKey(clickedDay.dateKey);
  }, [flowDays]);

  const handlePopupClose = useCallback(() => {
    setSelectedDayKey(null);
  }, []);

  return (
    <>
      <CardSection
        title={balanceTitle}
        titleClassName="text-base font-bold text-black font-['Outfit']"
        className="bg-[#F4F4F5] rounded-[20px] p-5"
      >
        {!hasFlowData ? (
          <span className="text-sm font-medium text-[#71717A]">{emptyLabel}</span>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="h-[210px] w-full rounded-xl bg-white/70 px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717A", fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis hide />
                  <ReferenceLine y={0} stroke="#D4D4D8" strokeWidth={1} />
                  <Bar
                    dataKey="income"
                    fill="#16A34A"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                    onClick={handleBarClick}
                  />
                  {expenseSeries.map((series, index) => (
                    <Bar
                      key={series.dataKey}
                      dataKey={series.dataKey}
                      stackId="expense"
                      fill={series.color}
                      radius={index === expenseSeries.length - 1 ? [0, 0, 6, 6] : [0, 0, 0, 0]}
                      isAnimationActive={false}
                      onClick={handleBarClick}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="block h-2 w-2 rounded-full bg-[#16A34A]" />
                <span className="text-[10px] font-medium text-[#71717A]">{popupIncomeLabel}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="block h-2 w-2 rounded-full bg-[#DC2626]" />
                <span className="text-[10px] font-medium text-[#71717A]">{popupExpenseLabel}</span>
              </div>
            </div>
          </div>
        )}
      </CardSection>

      <StatisticsFlowDetailPopup
        day={selectedDay}
        onClose={handlePopupClose}
        popupCloseLabel={popupCloseLabel}
        popupExpenseLabel={popupExpenseLabel}
        popupIncomeLabel={popupIncomeLabel}
      />
    </>
  );
});
