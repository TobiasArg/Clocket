import { SettingsModalShell } from "../SettingsModalShell";

export interface NotificationsPopupProps {
  enabled: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSave: (enabled: boolean) => Promise<void>;
}

export function NotificationsPopup({
  enabled,
  isOpen,
  onClose,
  onSave,
}: NotificationsPopupProps) {
  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Notificaciones"
      subtitle="Activa o pausa las alertas de la app"
    >
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-[#71717A]">
          Estado actual: {enabled ? "Activadas" : "Pausadas"}
        </span>

        <button
          type="button"
          onClick={() => {
            void onSave(!enabled);
          }}
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            enabled
              ? "bg-[#FEE2E2] text-[#B91C1C]"
              : "bg-[#DCFCE7] text-[#166534]"
          }`}
        >
          {enabled ? "Pausar notificaciones" : "Activar notificaciones"}
        </button>

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
