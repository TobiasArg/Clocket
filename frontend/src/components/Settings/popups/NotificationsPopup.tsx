import { useEffect, useState } from "react";
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setIsSaving(false);
    setError(null);
  }, [isOpen]);

  const handleToggle = async () => {
    if (isSaving) {
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onSave(!enabled);
    } catch {
      setError("No pudimos actualizar las notificaciones.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Notificaciones"
      subtitle="Controla si recibes alertas y recordatorios de actividad."
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-3">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Estado actual
          </span>
          <span className={`mt-1 block text-sm font-semibold ${enabled ? "text-[#166534]" : "text-[#B91C1C]"}`}>
            {enabled ? "Activadas" : "Pausadas"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleToggle();
          }}
          disabled={isSaving}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            enabled
              ? "bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]"
              : "bg-[#DCFCE7] text-[#166534] hover:bg-[#BBF7D0]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {isSaving ? "Actualizando..." : enabled ? "Pausar notificaciones" : "Activar notificaciones"}
        </button>

        {error && (
          <span className="rounded-lg bg-[#FEF2F2] px-2.5 py-2 text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}

        <div className="flex items-center justify-end">
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
