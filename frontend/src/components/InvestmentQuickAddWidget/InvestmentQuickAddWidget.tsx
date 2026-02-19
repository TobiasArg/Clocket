import { ActionButton } from "@/components";

export interface InvestmentQuickAddWidgetProps {
  costBasisInput: string;
  currentPriceInput: string;
  isFormValid: boolean;
  isLoading: boolean;
  isManualPriceEnabled: boolean;
  isOpen: boolean;
  isTickerUnavailable: boolean;
  nameInput: string;
  onCostBasisChange: (value: string) => void;
  onCurrentPriceChange: (value: string) => void;
  onManualPriceEnabledChange: (value: boolean) => void;
  onNameChange: (value: string) => void;
  onSharesChange: (value: string) => void;
  onSubmit: () => void;
  onTickerChange: (value: string) => void;
  quickAddCostBasisLabel: string;
  quickAddCurrentPriceLabel: string;
  quickAddNameLabel: string;
  quickAddSharesLabel: string;
  quickAddSubmitLabel: string;
  quickAddTickerLabel: string;
  quickAddTitle: string;
  sharesInput: string;
  showValidation: boolean;
  tickerAvailabilityMessage: string | null;
  tickerInput: string;
}

export function InvestmentQuickAddWidget({
  costBasisInput,
  currentPriceInput,
  isFormValid,
  isLoading,
  isManualPriceEnabled,
  isOpen,
  isTickerUnavailable,
  nameInput,
  onCostBasisChange,
  onCurrentPriceChange,
  onManualPriceEnabledChange,
  onNameChange,
  onSharesChange,
  onSubmit,
  onTickerChange,
  quickAddCostBasisLabel,
  quickAddCurrentPriceLabel,
  quickAddNameLabel,
  quickAddSharesLabel,
  quickAddSubmitLabel,
  quickAddTickerLabel,
  quickAddTitle,
  sharesInput,
  showValidation,
  tickerAvailabilityMessage,
  tickerInput,
}: InvestmentQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="px-5 py-3 bg-white">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#F4F4F5] p-4">
        <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">
          {quickAddTitle}
        </span>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{quickAddTickerLabel}</span>
          <input
            type="text"
            value={tickerInput}
            onChange={(event) => onTickerChange(event.target.value)}
            placeholder="AAPL"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          />
        </label>

        {tickerAvailabilityMessage && (
          <span className={`text-[11px] font-medium ${isTickerUnavailable ? "text-[#B45309]" : "text-[#52525B]"}`}>
            {tickerAvailabilityMessage}
          </span>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[#52525B]">{quickAddNameLabel}</span>
          <input
            type="text"
            value={nameInput}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Apple Inc."
            className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#52525B]">{quickAddSharesLabel}</span>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={sharesInput}
              onChange={(event) => onSharesChange(event.target.value)}
              placeholder="1"
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#52525B]">{quickAddCostBasisLabel}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={costBasisInput}
              onChange={(event) => onCostBasisChange(event.target.value)}
              placeholder="0.00"
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
            />
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isManualPriceEnabled}
            onChange={(event) => onManualPriceEnabledChange(event.target.checked)}
            disabled={isTickerUnavailable && isManualPriceEnabled}
            className="h-4 w-4 accent-[#10B981]"
          />
          <span className="text-xs font-medium text-[#52525B]">Ingresar precio manual</span>
        </label>

        {isManualPriceEnabled && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#52525B]">{quickAddCurrentPriceLabel}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={currentPriceInput}
              onChange={(event) => onCurrentPriceChange(event.target.value)}
              placeholder="0.00"
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
            />
          </label>
        )}

        {showValidation && !isFormValid && (
          <span className="text-[11px] font-medium text-[#71717A]">
            Completa los campos requeridos con valores mayores a 0.
          </span>
        )}

        <ActionButton
          icon="plus"
          label={quickAddSubmitLabel}
          iconColor="text-[#18181B]"
          labelColor="text-[#18181B]"
          bg={isFormValid && !isLoading ? "bg-[#E4E4E7]" : "bg-[#F4F4F5]"}
          padding="px-4 py-3"
          className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
          onClick={onSubmit}
        />
      </div>
    </div>
  );
}
