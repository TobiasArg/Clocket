import type { StatisticsFlowDay } from "@/types";
import { useAppSettings } from "@/hooks";
import { memo, useCallback, useMemo } from "react";

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

  const { chartData, expenseSeries, incomeSeries, hasFlowData } = useMemo(() => {
    const expenseTotalsByCategory = new Map<string, { color: string; total: number }>();
    const incomeTotalsByCategory = new Map<string, { color: string; total: number }>();
    flowDays.forEach((day) => {
      day.expenseByCategory.forEach((entry) => {
        const current = expenseTotalsByCategory.get(entry.category);
        expenseTotalsByCategory.set(entry.category, {
          color: current?.color ?? entry.color,
          total: (current?.total ?? 0) + entry.amount,
        });
      });
      day.incomeByCategory.forEach((entry) => {
        const current = incomeTotalsByCategory.get(entry.category);
        incomeTotalsByCategory.set(entry.category, {
          color: current?.color ?? entry.color,
          total: (current?.total ?? 0) + entry.amount,
        });
      });
    });

    const nextExpenseSeries = Array.from(expenseTotalsByCategory.entries())
      .sort((left, right) => right[1].total - left[1].total)
      .map(([category, value], index) => ({
        category,
        color: value.color,
        dataKey: `expense_${index}`,
      }));
    const nextIncomeSeries = Array.from(incomeTotalsByCategory.entries())
      .sort((left, right) => right[1].total - left[1].total)
      .map(([category, value], index) => ({
        category,
        color: value.color,
        dataKey: `income_${index}`,
      }));

    const expenseDataKeyByCategory = new Map(nextExpenseSeries.map((series) => [series.category, series.dataKey]));
    const incomeDataKeyByCategory = new Map(nextIncomeSeries.map((series) => [series.category, series.dataKey]));
    const nextChartData = flowDays.map((day) => {
      const row: Record<string, number | string> = {
        label: day.label,
      };

      nextIncomeSeries.forEach((series) => {
        row[series.dataKey] = 0;
      });
      nextExpenseSeries.forEach((series) => {
        row[series.dataKey] = 0;
      });
      day.incomeByCategory.forEach((entry) => {
        const dataKey = incomeDataKeyByCategory.get(entry.category);
        if (dataKey) {
          row[dataKey] = entry.amount;
        }
      });
      day.expenseByCategory.forEach((entry) => {
        const dataKey = expenseDataKeyByCategory.get(entry.category);
        if (dataKey) {
          row[dataKey] = -entry.amount;
        }
      });

      return row;
    });

    return {
      chartData: nextChartData,
      expenseSeries: nextExpenseSeries,
      incomeSeries: nextIncomeSeries,
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
    <div className="h-[210px] w-full rounded-xl bg-[var(--surface-muted)] px-2 py-2">
      <svg key={animationKey} viewBox="0 0 360 210" className="h-full w-full" aria-label="Flow chart">
        {(() => {
          const padding = { bottom: 24, left: 8, right: 8, top: 8 };
          const chartWidth = 360 - padding.left - padding.right;
          const chartHeight = 210 - padding.top - padding.bottom;

          const maxIncome = chartData.reduce((max, row) => {
            const totalIncome = incomeSeries.reduce((sum, series) => {
              return sum + Math.abs(Number(row[series.dataKey] ?? 0));
            }, 0);
            return Math.max(max, totalIncome);
          }, 0);
          const maxExpense = chartData.reduce((max, row) => {
            const totalExpense = expenseSeries.reduce((sum, series) => {
              return sum + Math.abs(Number(row[series.dataKey] ?? 0));
            }, 0);
            return Math.max(max, totalExpense);
          }, 0);
          const axisCap = Math.max(1, maxIncome, maxExpense);
          const zeroY = padding.top + (chartHeight * maxIncome) / (maxIncome + maxExpense || 1);

          const groupWidth = chartData.length > 0 ? chartWidth / chartData.length : chartWidth;
          const barWidth = Math.max(8, groupWidth * 0.52);

          const toY = (value: number) => (value / axisCap) * (chartHeight / 2);

          return (
            <>
              <line
                x1={padding.left}
                y1={zeroY}
                x2={padding.left + chartWidth}
                y2={zeroY}
                stroke={refLineColor}
                strokeWidth="1"
              />
              {chartData.map((row, index) => {
                const centerX = padding.left + groupWidth * index + groupWidth / 2;
                const barLeft = centerX - barWidth / 2;
                let incomeCursor = zeroY;
                const incomeBars = incomeSeries.map((series) => {
                  const value = Math.abs(Number(row[series.dataKey] ?? 0));
                  const height = toY(value);
                  const top = incomeCursor - height;
                  incomeCursor = top;
                  return { color: series.color, height, top };
                }).filter((bar) => bar.height > 0);

                let expenseCursor = zeroY;
                const expenseBars = expenseSeries.map((series) => {
                  const value = Math.abs(Number(row[series.dataKey] ?? 0));
                  const height = toY(value);
                  const top = expenseCursor;
                  expenseCursor += height;
                  return { color: series.color, height, top };
                }).filter((bar) => bar.height > 0);

                return (
                  <g
                    key={`flow-${index}`}
                    className="cursor-pointer"
                    onClick={() => handleBarClick(row, index)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleBarClick(row, index);
                      }
                    }}
                  >
                    {incomeBars.map((bar, incomeIndex) => (
                      <rect
                        key={`income-${incomeIndex}`}
                        x={barLeft}
                        y={bar.top}
                        width={barWidth}
                        height={bar.height}
                        rx={incomeIndex === incomeBars.length - 1 ? 6 : 0}
                        fill={bar.color}
                      />
                    ))}
                    {expenseBars.map((bar, expenseIndex) => (
                      <rect
                        key={`expense-${expenseIndex}`}
                        x={barLeft}
                        y={bar.top}
                        width={barWidth}
                        height={bar.height}
                        rx={expenseIndex === expenseBars.length - 1 ? 6 : 0}
                        fill={bar.color}
                      />
                    ))}
                    <text
                      x={centerX}
                      y={204}
                      textAnchor="middle"
                      fill={tickColor}
                      fontSize="10"
                      fontWeight="600"
                    >
                      {String(row.label)}
                    </text>
                  </g>
                );
              })}
            </>
          );
        })()}
      </svg>
    </div>
  );
});
