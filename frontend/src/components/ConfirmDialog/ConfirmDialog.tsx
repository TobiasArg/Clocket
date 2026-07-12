import { memo, useId, useRef } from "react";
import { useDialogFocusLifecycle } from "@/hooks/useDialogFocusLifecycle";

export interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  detailLabel?: string;
  isLoading?: boolean;
  isOpen?: boolean;
  loadingLabel?: string;
  messageLabel: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  rootClassName?: string;
  titleLabel: string;
}

export const ConfirmDialog = memo(function ConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Eliminar",
  detailLabel,
  isLoading = false,
  isOpen = false,
  loadingLabel = "Eliminando…",
  messageLabel,
  onCancel,
  onConfirm,
  rootClassName = "fixed inset-0 z-50",
  titleLabel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useDialogFocusLifecycle({
    containerRef: dialogRef,
    initialFocusRef: cancelButtonRef,
    isDismissDisabled: isLoading,
    isOpen,
    onDismiss: onCancel,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`${rootClassName} flex items-center justify-center px-5`}>
      <button
        type="button"
        className="absolute inset-0 bg-black/25"
        onClick={isLoading ? undefined : onCancel}
        aria-label="Cerrar confirmación"
        disabled={isLoading}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl bg-[var(--panel-bg)] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
      >
        <h2 id={titleId} className="block text-sm font-bold text-[var(--text-primary)] font-['Outfit']">
          {titleLabel}
        </h2>
        <p id={descriptionId} className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
          {messageLabel}
        </p>
        {detailLabel && (
          <p className="mt-2 text-xs font-semibold text-[var(--text-primary)]">
            {detailLabel}
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-[var(--surface-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] disabled:cursor-not-allowed disabled:opacity-60 ${
              isLoading
                ? "bg-[var(--surface-border)]"
                : "bg-[#DC2626] hover:bg-[#B91C1C]"
            }`}
          >
            {isLoading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
