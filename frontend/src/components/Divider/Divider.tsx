export interface DividerProps {
  color?: string;
  className?: string;
}

export function Divider({
  color = "bg-[#F4F4F5]",
  className = "",
}: DividerProps) {
  return <div className={`w-full h-px ${color} ${className}`} />;
}
