import { useEffect, useId, useRef, type ReactNode } from "react";
import { useDialogFocusLifecycle } from "@/hooks/useDialogFocusLifecycle";
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();

  useDialogFocusLifecycle({
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    isOpen,
    onDismiss: onClose,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar ventana"
      />
      <div
        ref={dialogRef}
        className="clocket-glass-card relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-[var(--panel-bg)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--surface-border)] pb-3">
          <div className="min-w-0">
            <h2 id={titleId} className="block text-base font-bold text-[var(--text-primary)] font-['Outfit']">{title}</h2>
            {subtitle && (
              <p id={subtitleId} className="mt-1 text-xs font-medium leading-relaxed text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--surface-muted)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--surface-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
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
