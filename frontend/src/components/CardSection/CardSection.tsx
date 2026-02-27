import { memo, type ReactNode } from "react";

export interface CardSectionProps {
  title?: string;
  titleClassName?: string;
  action?: ReactNode;
  gap?: string;
  children: ReactNode;
  className?: string;
}

export const CardSection = memo(function CardSection({
  title,
  titleClassName = "text-xl font-bold text-[var(--text-primary)] font-['Outfit']",
  action,
  gap = "gap-4",
  children,
  className = "",
}: CardSectionProps) {
  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && <span className={titleClassName}>{title}</span>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
});
