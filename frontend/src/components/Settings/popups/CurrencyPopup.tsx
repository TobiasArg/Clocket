import type { AppSettings } from "@/types";
import { PhosphorIcon } from "@/components/PhosphorIcon/PhosphorIcon";
import { useEffect, useState } from "react";
import { SettingsModalShell } from "../SettingsModalShell";

export interface CurrencyPopupProps {
  currentCurrency: AppSettings["currency"];
  isOpen: boolean;
  onClose: () => void;
  onSave: (currency: AppSettings["currency"]) => Promise<void>;
}

const OPTIONS = [
  {
    id: "USD",
    label: "USD",
    detail: "Dólar estadounidense",
  },
  {
    id: "ARS",
    label: "ARS",
    detail: "Peso argentino",
  },
] as const;

export function CurrencyPopup({
  currentCurrency,
  isOpen,
  onClose,
  onSave,
}: CurrencyPopupProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setIsSaving(false);
    setError(null);
  }, [isOpen]);

  const handleSave = async (currency: AppSettings["currency"]) => {
    if (isSaving || currency === currentCurrency) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave(currency);
    } catch {
      setError("No pudimos actualizar la moneda.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Moneda"
      subtitle="Se aplicará como referencia por defecto en toda la app."
    >
      <div className="flex flex-col gap-3">
        {OPTIONS.map((option) => {
          const isSelected = option.id === currentCurrency;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                void handleSave(option.id);
              }}
              disabled={isSaving}
              className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition ${
                isSelected
                  ? "border-[#111827] bg-[#111827] text-white"
                  : "border-[var(--surface-border)] bg-white text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
              aria-pressed={isSelected}
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{option.label}</span>
                <span className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-[var(--text-secondary)]"}`}>
                  {option.detail}
                </span>
              </span>
              <PhosphorIcon
                name={isSelected ? "check-circle" : "circle"}
                className={isSelected ? "text-white" : "text-[#A1A1AA]"}
                size="text-[18px]"
              />
            </button>
          );
        })}

        {error && (
          <span className="rounded-lg bg-[#FEF2F2] px-2.5 py-2 text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}

        <div className="mt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-[var(--surface-border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cerrar
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
