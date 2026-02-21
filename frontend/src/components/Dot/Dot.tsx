export interface DotProps {
  color?: string;
  size?: string;
  className?: string;
}

export function Dot({
  color = "bg-[var(--text-primary)]",
  size = "w-2.5 h-2.5",
  className = "",
}: DotProps) {
  return <div className={`rounded-full ${size} ${color} ${className}`} />;
}
