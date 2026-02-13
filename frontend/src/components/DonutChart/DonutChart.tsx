import type { DonutSegment } from "@/types";
import { Dot } from "@/components";

const DONUT_RADIUS = 40;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

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
  let cumulativeOffset = 0;
  const arcs = segments.map((seg) => {
    const arcLength = (seg.percentage / 100) * DONUT_CIRCUMFERENCE;
    const gapLength = DONUT_CIRCUMFERENCE - arcLength;
    const offset = -cumulativeOffset;
    cumulativeOffset += arcLength;
    return { ...seg, arcLength, gapLength, offset };
  });

  return (
    <div className={`flex items-center gap-5 w-full ${className}`}>
      <div className={`relative ${size} shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          role="img"
          aria-label="Distribución de gastos"
        >
          {arcs.map((arc) => (
            <circle
              key={arc.name}
              cx="50"
              cy="50"
              r={DONUT_RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth="20"
              strokeDasharray={`${arc.arcLength} ${arc.gapLength}`}
              strokeDashoffset={arc.offset}
            />
          ))}
          <circle cx="50" cy="50" r="30" fill={bgFill} />
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && <span className={centerValueClassName}>{centerValue}</span>}
            {centerLabel && <span className={centerLabelClassName}>{centerLabel}</span>}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="flex flex-col gap-2 flex-1">
          {segments.map((seg) => (
            <div key={seg.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dot color={`bg-[${seg.color}]`} size="w-2.5 h-2.5" />
                <span className={legendNameClassName}>{seg.name}</span>
              </div>
              <span className={legendValueClassName}>{seg.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
