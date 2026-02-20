import type { ReactNode } from "react";

export interface SettingsGroupProps {
  title: string;
  titleClassName?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsGroup({
  title,
  titleClassName = "mb-1 text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]",
  children,
  className = "",
}: SettingsGroupProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className={titleClassName}>{title}</span>
      <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)]">
        {children}
      </div>
    </div>
  );
}
