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
    <div className={`inline-flex min-w-0 max-w-full items-center ${bg} ${rounded} ${padding} ${className}`}>
      <span className={`block truncate ${fontSize} ${fontWeight} ${textColor}`}>{text}</span>
    </div>
  );
}
