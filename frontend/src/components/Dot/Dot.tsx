import { memo } from "react";
export interface DotProps {
  color?: string;
  size?: string;
  className?: string;
}

export const Dot = memo(function Dot({
  color = "bg-[var(--text-primary)]",
  size = "w-2.5 h-2.5",
  className = "",
}: DotProps) {
  return <div className={`rounded-full ${size} ${color} ${className}`} />;
});
