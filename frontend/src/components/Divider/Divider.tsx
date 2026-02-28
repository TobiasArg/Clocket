import { memo } from "react";
export interface DividerProps {
  color?: string;
  className?: string;
}

export const Divider = memo(function Divider({
  color = "bg-[var(--surface-muted)]",
  className = "",
}: DividerProps) {
  return <div className={`w-full h-px ${color} ${className}`} />;
});
