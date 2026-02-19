export interface InvestmentQuickAddWidgetProps {
  isOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isFormValid: boolean;
  showValidation: boolean;
  assetTypeInput: "stock" | "crypto";
  tickerInput: string;
  usdSpentInput: string;
  buyPriceInput: string;
  derivedAmountLabel: string;
  onClose: () => void;
  onSubmit: () => void;
  onAssetTypeChange: (value: "stock" | "crypto") => void;
  onTickerChange: (value: string) => void;
  onUsdSpentChange: (value: string) => void;
  onBuyPriceChange: (value: string) => void;
}

export function InvestmentQuickAddWidget({
  isOpen,
  isEditing,
  isLoading,
  isFormValid,
  showValidation,
  assetTypeInput,
  tickerInput,
  usdSpentInput,
  buyPriceInput,
  derivedAmountLabel,
  onClose,
  onSubmit,
  onAssetTypeChange,
  onTickerChange,
  onUsdSpentChange,
  onBuyPriceChange,
}: InvestmentQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-[#111827] font-['Outfit']">
            {isEditing ? "Editar posición" : "Nueva posición"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E5E7EB] px-2 py-1 text-xs font-semibold text-[#374151]"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Asset Type</span>
            <select
              value={assetTypeInput}
              onChange={(event) => onAssetTypeChange(event.target.value as "stock" | "crypto")}
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827]"
            >
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Ticker</span>
            <input
              type="text"
              value={tickerInput}
              onChange={(event) => onTickerChange(event.target.value.toUpperCase())}
              placeholder={assetTypeInput === "crypto" ? "BTC" : "AAPL"}
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">USD gastado</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={usdSpentInput}
              onChange={(event) => onUsdSpentChange(event.target.value)}
              placeholder="1000"
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#4B5563]">Buy price (USD)</span>
            <input
              type="number"
              min="0.00000001"
              step="0.00000001"
              value={buyPriceInput}
              onChange={(event) => onBuyPriceChange(event.target.value)}
              placeholder="150"
              className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm font-medium text-[#111827]"
            />
          </label>
        </div>

        <div className="mt-3 rounded-xl bg-[#F3F4F6] px-3 py-2">
          <span className="text-xs font-medium text-[#4B5563]">
            Derivado: <strong>amount = usd_gastado / buy_price</strong>
          </span>
          <div className="mt-1 text-sm font-semibold text-[#111827]">Amount: {derivedAmountLabel}</div>
        </div>

        {showValidation && !isFormValid && (
          <span className="mt-3 block text-xs font-medium text-[#B45309]">
            Completa ticker, usd_gastado y buy_price con valores mayores a 0.
          </span>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#D1D5DB] px-4 py-2 text-sm font-semibold text-[#374151]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isFormValid || isLoading}
            className="rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isEditing ? "Guardar cambios" : "Agregar posición"}
          </button>
        </div>
      </div>
    </div>
  );
}
