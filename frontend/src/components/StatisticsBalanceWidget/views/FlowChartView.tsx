import type { StatisticsFlowDay } from "@/types";
import { useAppSettings } from "@/hooks";
import { memo, useCallback, useMemo } from "react";
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from "recharts";

export interface FlowChartViewProps {
  animationKey: string;
  emptyLabel: string;
  flowDays: StatisticsFlowDay[];
  onSelectDay: (day: StatisticsFlowDay) => void;
}

export const FlowChartView = memo(function FlowChartView({
  animationKey,
  emptyLabel,
  flowDays,
  onSelectDay,
}: FlowChartViewProps) {
  const { settings } = useAppSettings();
  const isDark = settings?.theme === "dark";
  const tickColor = isDark ? "#a1a1aa" : "#71717a";
  const refLineColor = isDark ? "#3f3f46" : "#d4d4d8";

  const { chartData, expenseSeries, hasFlowData } = useMemo(() => {
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
      expenseSeries: nextExpenseSeries,
      hasFlowData: flowDays.some((day) => day.incomeTotal > 0 || day.expenseTotal > 0),
    };
  }, [flowDays]);

  const handleBarClick = useCallback((_entry: unknown, index: number) => {
    const clickedDay = flowDays[index];
    if (!clickedDay) {
      return;
    }

    onSelectDay(clickedDay);
  }, [flowDays, onSelectDay]);

  if (!hasFlowData) {
    return <span className="text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>;
  }

  return (
    <div className="h-[210px] w-full rounded-xl bg-[var(--panel-bg)]/70 px-2 py-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart key={animationKey} data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: tickColor, fontSize: 10, fontWeight: 600 }}
          />
          <YAxis hide />
          <ReferenceLine y={0} stroke={refLineColor} strokeWidth={1} />
          <Bar
            dataKey="income"
            fill="#16A34A"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={360}
            animationEasing="ease-out"
            onClick={handleBarClick}
          />
          {expenseSeries.map((series, index) => (
            <Bar
              key={series.dataKey}
              dataKey={series.dataKey}
              stackId="expense"
              fill={series.color}
              radius={index === expenseSeries.length - 1 ? [0, 0, 6, 6] : [0, 0, 0, 0]}
              isAnimationActive
              animationDuration={360}
              animationEasing="ease-out"
              onClick={handleBarClick}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
