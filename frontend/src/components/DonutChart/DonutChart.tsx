import type { DonutSegment } from "@/types";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export interface DonutChartProps {
  segments: DonutSegment[];
  centerValue?: string;
  centerLabel?: string;
  showLegend?: boolean;
  size?: string;
  bgFill?: string;
  centerValueClassName?: string;
  centerLabelClassName?: string;
  legendNameClassName?: string;
  legendValueClassName?: string;
  className?: string;
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  showLegend = true,
  size = "w-[100px] h-[100px]",
  bgFill = "#F4F4F5",
  centerValueClassName = "text-sm font-bold text-black font-['Outfit']",
  centerLabelClassName = "text-[9px] font-medium text-[#71717A]",
  legendNameClassName = "text-[13px] font-medium text-black",
  legendValueClassName = "text-xs font-medium text-[#71717A]",
  className = "",
}: DonutChartProps) {
  const centerBgClassName = bgFill === "#FFFFFF" ? "bg-white" : "bg-[#F4F4F5]";
  const hasPositivePercentages = segments.some((segment) => segment.percentage > 0);
  const normalizedSegments = hasPositivePercentages
    ? segments.filter((segment) => segment.percentage > 0)
    : segments.map((segment) => ({
      ...segment,
      percentage: segments.length > 0 ? Math.round(100 / segments.length) : 0,
    }));

  return (
    <div className={`flex items-center gap-5 w-full ${className}`}>
      <div className={`relative ${size} shrink-0`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalizedSegments}
              dataKey="percentage"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="100%"
              paddingAngle={2}
              stroke={bgFill}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {normalizedSegments.map((segment) => (
                <Cell key={segment.name} fill={segment.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {(centerValue || centerLabel) && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-full ${centerBgClassName}`}>
            {centerValue && <span className={centerValueClassName}>{centerValue}</span>}
            {centerLabel && <span className={centerLabelClassName}>{centerLabel}</span>}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2 flex-1">
          {segments.map((segment) => (
            <div key={segment.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" aria-hidden="true">
                  <circle cx="5" cy="5" r="5" fill={segment.color} />
                </svg>
                <span className={legendNameClassName}>{segment.name}</span>
              </div>
              <span className={legendValueClassName}>{segment.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
