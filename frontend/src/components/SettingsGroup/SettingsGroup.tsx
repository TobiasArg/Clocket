import type { ReactNode } from "react";

export interface SettingsGroupProps {
  title: string;
  titleClassName?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsGroup({
  title,
  titleClassName = "text-[11px] font-semibold text-[#71717A] tracking-[1px] mb-1",
  children,
  className = "",
}: SettingsGroupProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className={titleClassName}>{title}</span>
      <div className="flex flex-col bg-[#F4F4F5] rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}
