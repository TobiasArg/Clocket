import { useEffect } from "react";

export interface InvestmentDeleteConfirmDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  ticker?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function InvestmentDeleteConfirmDialog({
  isOpen,
  isLoading = false,
  ticker = "",
  onCancel,
  onConfirm,
}: InvestmentDeleteConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen || isLoading) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLoading, isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 px-5">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCancel}
        aria-label="Cerrar confirmación"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.14)]"
      >
        <span className="block text-sm font-bold text-black font-['Outfit']">
          Confirmar eliminación
        </span>
        <span className="mt-1 block text-xs font-medium text-[#71717A]">
          Esta acción eliminará la posición seleccionada del portfolio.
        </span>

        {ticker && (
          <span className="mt-2 block text-xs font-semibold text-black">
            {ticker}
          </span>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold text-[#71717A] transition-colors hover:bg-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] ${
              isLoading
                ? "bg-[#D4D4D8]"
                : "bg-[#DC2626] hover:bg-[#B91C1C]"
            }`}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
