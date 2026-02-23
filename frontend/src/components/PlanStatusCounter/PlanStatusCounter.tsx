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
      : "bg-[var(--text-primary)]";

  const countColorClassName = status === "active"
    ? "text-[#15803D]"
    : status === "finished"
      ? "text-[var(--text-secondary)]"
      : "text-[var(--text-primary)]";

  const containerClassName = isSelected
    ? "border-[var(--text-primary)] bg-[var(--surface-border)]"
    : "border-transparent bg-[var(--surface-muted)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`clocket-glass-card flex min-w-0 flex-1 flex-col gap-1 rounded-xl border px-3 py-2 text-left ${containerClassName}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dotColorClassName}`} />
        <span className="truncate text-[10px] font-medium text-[var(--text-secondary)]">{resolvedLabel}</span>
      </div>
      <span className={`text-xl font-bold font-['Outfit'] ${countColorClassName}`}>{count}</span>
    </button>
  );
});
