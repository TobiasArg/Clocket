import { useEffect, type ReactNode } from "react";
import { PhosphorIcon } from "@/components/PhosphorIcon/PhosphorIcon";

export interface SettingsModalShellProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function SettingsModalShell({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
}: SettingsModalShellProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center"
      onClick={onClose}
      role="button"
      tabIndex={-1}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-sm font-bold text-[var(--text-primary)] font-['Outfit']">{title}</span>
            {subtitle && (
              <span className="mt-1 block text-xs font-medium text-[var(--text-secondary)]">{subtitle}</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--surface-muted)] p-2 text-[var(--text-secondary)]"
            aria-label="Cerrar"
          >
            <PhosphorIcon name="x" size="text-[16px]" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
