import { useEffect } from "react";
import type { AssetType, EntryType } from "@/domain/investments/portfolioTypes";

export interface InvestmentQuickAddWidgetProps {
  isOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isFormValid: boolean;
  showValidation: boolean;
  assetTypeInput: AssetType;
  entryTypeInput: EntryType;
  tickerInput: string;
  usdSpentInput: string;
  buyPriceInput: string;
  createdAtInput: string;
  availableAmountLabel: string;
  derivedAmountLabel: string;
  validationMessage: string | null;
  onClose: () => void;
  onSubmit: () => void;
  onAssetTypeChange: (value: AssetType) => void;
  onEntryTypeChange: (value: EntryType) => void;
  onTickerChange: (value: string) => void;
  onUsdSpentChange: (value: string) => void;
  onBuyPriceChange: (value: string) => void;
  onCreatedAtChange: (value: string) => void;
}

export function InvestmentQuickAddWidget({
  isOpen,
  isEditing,
  isLoading,
  isFormValid,
  showValidation,
  assetTypeInput,
  entryTypeInput,
  tickerInput,
  usdSpentInput,
  buyPriceInput,
  createdAtInput,
  availableAmountLabel,
  derivedAmountLabel,
  validationMessage,
  onClose,
  onSubmit,
  onAssetTypeChange,
  onEntryTypeChange,
  onTickerChange,
  onUsdSpentChange,
  onBuyPriceChange,
  onCreatedAtChange,
}: InvestmentQuickAddWidgetProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Cerrar formulario"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-h-[88vh] max-w-[560px] overflow-auto rounded-2xl bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-[#111827] font-['Outfit']">
            {isEditing ? "Nuevo movimiento" : "Nueva entrada"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-xs font-semibold text-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Tipo</span>
            <select
              value={entryTypeInput}
              onChange={(event) => onEntryTypeChange(event.target.value as EntryType)}
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Activo</span>
            <select
              value={assetTypeInput}
              onChange={(event) => onAssetTypeChange(event.target.value as AssetType)}
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <option value="stock">Acción</option>
              <option value="crypto">Cripto</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Ticker</span>
            <input
              type="text"
              value={tickerInput}
              onChange={(event) => onTickerChange(event.target.value.toUpperCase())}
              placeholder={assetTypeInput === "crypto" ? "BTC" : "AAPL"}
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">USD</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={usdSpentInput}
              onChange={(event) => onUsdSpentChange(event.target.value)}
              placeholder="1000"
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Precio de entrada (USD)</span>
            <input
              type="number"
              min="0.00000001"
              step="0.00000001"
              value={buyPriceInput}
              onChange={(event) => onBuyPriceChange(event.target.value)}
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Fecha</span>
            <input
              type="datetime-local"
              value={createdAtInput}
              onChange={(event) => onCreatedAtChange(event.target.value)}
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>
        </div>

        <div className="mt-3 rounded-xl bg-[#F3F4F6] px-3 py-2">
          <span className="text-xs font-medium text-[#4B5563]">
            Cantidad derivada: <strong>amount = USD / precio</strong>
          </span>
          <div className="mt-1 text-sm font-semibold text-[#111827]">Cantidad: {derivedAmountLabel}</div>
          {entryTypeInput === "egreso" && (
            <div className="mt-1 text-xs font-medium text-[#6B7280]">
              Disponible para egreso: {availableAmountLabel}
            </div>
          )}
        </div>

        {showValidation && validationMessage && (
          <span className="mt-3 block text-xs font-medium text-[#B45309]">
            {validationMessage}
          </span>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isFormValid || isLoading}
            className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50"
          >
            {isEditing ? "Guardar movimiento" : "Guardar entrada"}
          </button>
        </div>
      </div>
    </div>
  );
}
