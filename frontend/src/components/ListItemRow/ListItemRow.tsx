import type { ReactNode } from "react";

export interface ListItemRowProps {
  left: ReactNode;
  title: string;
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  right?: ReactNode;
  onClick?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  padding?: string;
  gap?: string;
  className?: string;
}

export function ListItemRow({
  left,
  title,
  subtitle,
  titleClassName = "text-base font-semibold text-black font-['Outfit']",
  subtitleClassName = "text-xs font-normal text-[#71717A]",
  right,
  onClick,
  showBorder = false,
  borderColor = "border-[#F4F4F5]",
  padding = "py-4",
  gap = "gap-3",
  className = "",
}: ListItemRowProps) {
  const classes = `flex items-center justify-between ${padding} text-left ${showBorder ? `border-b ${borderColor}` : ""} ${className}`;

  const content = (
    <>
      <div className={`flex items-center ${gap}`}>
        {left}
        <div className="flex flex-col gap-0.5">
          <span className={titleClassName}>{title}</span>
          {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
