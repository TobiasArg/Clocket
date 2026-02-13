export interface PhosphorIconProps {
  name: string;
  className?: string;
  size?: string;
}

export function PhosphorIcon({
  name,
  className = "",
  size = "text-[20px]",
}: PhosphorIconProps) {
  return (
    <span className={`${size} font-['Phosphor'] ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
