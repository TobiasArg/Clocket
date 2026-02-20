import type { AppSettings } from "@/types";
import { SettingsModalShell } from "../SettingsModalShell";

export interface ThemePopupProps {
  currentTheme: AppSettings["theme"];
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: AppSettings["theme"]) => Promise<void>;
}

export function ThemePopup({
  currentTheme,
  isOpen,
  onClose,
  onSave,
}: ThemePopupProps) {
  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Tema"
      subtitle="Elige entre apariencia clara u oscura"
    >
      <div className="flex flex-col gap-3">
        {([
          { id: "light", label: "Claro" },
          { id: "dark", label: "Oscuro" },
        ] as const).map((option) => {
          const isSelected = currentTheme === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                void onSave(option.id);
              }}
              className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                isSelected
                  ? "border-[#18181B] bg-[#18181B] text-white"
                  : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:bg-[#F4F4F5]"
              }`}
            >
              {option.label}
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
