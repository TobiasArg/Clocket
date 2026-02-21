import type { AppSettings } from "@/types";
import { PhosphorIcon } from "@/components/PhosphorIcon/PhosphorIcon";
import { useEffect, useState } from "react";
import { SettingsModalShell } from "../SettingsModalShell";

export interface ThemePopupProps {
  currentTheme: AppSettings["theme"];
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: AppSettings["theme"]) => Promise<void>;
}

const OPTIONS = [
  { id: "light", label: "Claro", detail: "Interfaz luminosa y limpia", icon: "sun" },
  { id: "dark", label: "Oscuro", detail: "Menos brillo en ambientes oscuros", icon: "moon" },
] as const;

export function ThemePopup({
  currentTheme,
  isOpen,
  onClose,
  onSave,
}: ThemePopupProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setIsSaving(false);
    setError(null);
  }, [isOpen]);

  const handleSave = async (theme: AppSettings["theme"]) => {
    if (isSaving || theme === currentTheme) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave(theme);
    } catch {
      setError("No pudimos actualizar el tema.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Tema"
      subtitle="Personaliza la apariencia general de la aplicación."
    >
      <div className="flex flex-col gap-3">
        {OPTIONS.map((option) => {
          const isSelected = currentTheme === option.id;

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
              <span className="flex items-center gap-2.5">
                <PhosphorIcon name={option.icon} size="text-[16px]" />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className={`text-xs font-medium ${isSelected ? "text-white/80" : "text-[var(--text-secondary)]"}`}>
                    {option.detail}
                  </span>
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
