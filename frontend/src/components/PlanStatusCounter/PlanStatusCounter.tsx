import type { CuotaPlanStatus } from "@/types";
import { memo } from "react";

export type PlanStatusCounterType = CuotaPlanStatus | "all";

export interface PlanStatusCounterProps {
  count: number;
  isSelected?: boolean;
  label?: string;
  onClick?: () => void;
  status: PlanStatusCounterType;
}

export const PlanStatusCounter = memo(function PlanStatusCounter({
  count,
  isSelected = false,
  label,
  onClick,
  status,
}: PlanStatusCounterProps) {
  const resolvedLabel = label ?? (
    status === "active"
      ? "Activos"
      : status === "finished"
        ? "Finalizados"
        : "Totales"
  );

  const dotColorClassName = status === "active"
    ? "bg-[#16A34A]"
    : status === "finished"
      ? "bg-[#71717A]"
      : "bg-[#18181B]";

  const countColorClassName = status === "active"
    ? "text-[#15803D]"
    : status === "finished"
      ? "text-[#27272A]"
      : "text-[#09090B]";

  const containerClassName = isSelected
    ? "border-[#18181B] bg-[#E4E4E7]"
    : "border-transparent bg-[#F4F4F5]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col gap-1 rounded-xl border px-3 py-2 text-left ${containerClassName}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColorClassName}`} />
        <span className="truncate text-[10px] font-medium text-[#71717A]">{resolvedLabel}</span>
      </div>
      <span className={`text-xl font-bold font-['Outfit'] ${countColorClassName}`}>{count}</span>
    </button>
  );
});
