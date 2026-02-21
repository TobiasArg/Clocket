export interface DividerProps {
  color?: string;
  className?: string;
}

export function Divider({
  color = "bg-[var(--surface-muted)]",
  className = "",
}: DividerProps) {
  return <div className={`w-full h-px ${color} ${className}`} />;
}
