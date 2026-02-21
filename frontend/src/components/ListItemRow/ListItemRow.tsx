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
  titleClassName = "text-base font-semibold text-[var(--text-primary)] font-['Outfit']",
  subtitleClassName = "text-xs font-normal text-[var(--text-secondary)]",
  right,
  onClick,
  showBorder = false,
  borderColor = "border-[var(--surface-border)]",
  padding = "py-4",
  gap = "gap-3",
  className = "",
}: ListItemRowProps) {
  const classes = `flex min-w-0 items-center justify-between ${padding} text-left ${showBorder ? `border-b ${borderColor}` : ""} ${className}`;

  const content = (
    <>
      <div className={`flex min-w-0 flex-1 items-center ${gap}`}>
        {left}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={`block truncate ${titleClassName}`}>{title}</span>
          {subtitle && <span className={`block truncate ${subtitleClassName}`}>{subtitle}</span>}
        </div>
      </div>
      {right && <div className="shrink-0 pl-2">{right}</div>}
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
