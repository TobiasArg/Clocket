import type { ReactNode } from "react";

export interface SummaryPanelProps {
  title?: string;
  titleClassName?: string;
  bg?: string;
  padding?: string;
  rounded?: string;
  gap?: string;
  children: ReactNode;
  className?: string;
}

export function SummaryPanel({
  title,
  titleClassName = "text-xs font-semibold text-[var(--text-secondary)] tracking-[2px]",
  bg = "bg-black",
  padding = "p-5",
  rounded = "",
  gap = "gap-4",
  children,
  className = "",
}: SummaryPanelProps) {
  return (
    <div className={`flex flex-col ${gap} ${bg} ${padding} ${rounded} ${className}`}>
      {title && <span className={titleClassName}>{title}</span>}
      {children}
    </div>
  );
}
