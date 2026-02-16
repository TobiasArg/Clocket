export interface TransactionDeleteConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  isOpen?: boolean;
  messageLabel?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  titleLabel?: string;
  transactionName?: string;
}

export function TransactionDeleteConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Eliminar",
  isLoading = false,
  isOpen = false,
  messageLabel = "Esta acción eliminará la transacción seleccionada.",
  onCancel,
  onConfirm,
  titleLabel = "Confirmar eliminación",
  transactionName = "",
}: TransactionDeleteConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-5">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.14)]">
        <span className="block text-sm font-bold text-black font-['Outfit']">
          {titleLabel}
        </span>
        <span className="mt-1 block text-xs font-medium text-[#71717A]">
          {messageLabel}
        </span>
        {transactionName && (
          <span className="mt-2 block text-xs font-semibold text-black">
            {transactionName}
          </span>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold text-[#71717A] transition-colors hover:bg-[#F4F4F5]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              isLoading
                ? "bg-[#D4D4D8] text-white"
                : "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
            }`}
          >
            {isLoading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
