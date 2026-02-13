export interface TextBadgeProps {
  text: string;
  bg?: string;
  textColor?: string;
  rounded?: string;
  padding?: string;
  fontSize?: string;
  fontWeight?: string;
  className?: string;
}

export function TextBadge({
  text,
  bg = "bg-[#F4F4F5]",
  textColor = "text-black",
  rounded = "rounded-[10px]",
  padding = "px-3 py-1.5",
  fontSize = "text-sm",
  fontWeight = "font-semibold",
  className = "",
}: TextBadgeProps) {
  return (
    <div className={`${bg} ${rounded} ${padding} ${className}`}>
      <span className={`${fontSize} ${fontWeight} ${textColor}`}>{text}</span>
    </div>
  );
}
