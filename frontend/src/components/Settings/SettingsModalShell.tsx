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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="button"
      tabIndex={-1}
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--surface-border)] bg-[var(--panel-bg)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--surface-border)] pb-3">
          <div className="min-w-0">
            <span className="block text-base font-bold text-[var(--text-primary)] font-['Outfit']">{title}</span>
            {subtitle && (
              <span className="mt-1 block text-xs font-medium leading-relaxed text-[var(--text-secondary)]">{subtitle}</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--surface-muted)] p-2 text-[var(--text-secondary)] transition hover:bg-[#EAEAF0]"
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
