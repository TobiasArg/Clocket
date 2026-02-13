export interface AvatarProps {
  initials: string;
  bg?: string;
  size?: string;
  textColor?: string;
  textSize?: string;
  fontWeight?: string;
  className?: string;
}

export function Avatar({
  initials,
  bg = "bg-black",
  size = "w-[44px] h-[44px]",
  textColor = "text-white",
  textSize = "text-sm",
  fontWeight = "font-semibold",
  className = "",
}: AvatarProps) {
  return (
    <div className={`flex items-center justify-center ${size} rounded-full ${bg} ${className}`}>
      <span className={`${fontWeight} ${textSize} ${textColor}`}>{initials}</span>
    </div>
  );
}
