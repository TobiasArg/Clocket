import type { AppSettings } from "@/types";
import { SettingsModalShell } from "../SettingsModalShell";

export interface CurrencyPopupProps {
  currentCurrency: AppSettings["currency"];
  isOpen: boolean;
  onClose: () => void;
  onSave: (currency: AppSettings["currency"]) => Promise<void>;
}

export function CurrencyPopup({
  currentCurrency,
  isOpen,
  onClose,
  onSave,
}: CurrencyPopupProps) {
  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Moneda"
      subtitle="Selecciona la moneda principal de la app"
    >
      <div className="flex flex-col gap-3">
        {(["USD", "EUR"] as const).map((option) => {
          const isSelected = option === currentCurrency;

          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                void onSave(option);
              }}
              className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                isSelected
                  ? "border-[#18181B] bg-[#18181B] text-white"
                  : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:bg-[#F4F4F5]"
              }`}
            >
              {option === "USD" ? "USD - Dólar estadounidense" : "EUR - Euro"}
            </button>
          );
        })}

        <div className="mt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold text-[#71717A]"
          >
            Volver a settings
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
