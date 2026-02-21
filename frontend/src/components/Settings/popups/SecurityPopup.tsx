import { useEffect, useState } from "react";
import { hashPin, isValidPin, verifyPin } from "@/utils";
import { SettingsModalShell } from "../SettingsModalShell";

export interface SecurityPopupProps {
  pinHash: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePinHash: (pinHash: string | null) => Promise<void>;
}

export function SecurityPopup({
  pinHash,
  isOpen,
  onClose,
  onSavePinHash,
}: SecurityPopupProps) {
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCurrentPin("");
    setNextPin("");
    setConfirmPin("");
    setError(null);
    setIsSaving(false);
  }, [isOpen]);

  const handleSave = async (): Promise<void> => {
    setError(null);

    if (!isValidPin(nextPin)) {
      setError("El PIN debe tener exactamente 4 dígitos.");
      return;
    }

    if (nextPin !== confirmPin) {
      setError("La confirmación no coincide.");
      return;
    }

    setIsSaving(true);

    try {
      if (pinHash) {
        const isCurrentValid = await verifyPin(currentPin, pinHash);
        if (!isCurrentValid) {
          setError("PIN actual inválido.");
          return;
        }
      }

      const nextHash = await hashPin(nextPin);
      await onSavePinHash(nextHash);
    } catch {
      setError("No pudimos guardar el PIN.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!pinHash) {
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const isCurrentValid = await verifyPin(currentPin, pinHash);
      if (!isCurrentValid) {
        setError("PIN actual inválido.");
        return;
      }

      await onSavePinHash(null);
    } catch {
      setError("No pudimos desactivar el PIN.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Seguridad"
      subtitle={pinHash ? "PIN activo para proteger acciones sensibles." : "Activa un PIN para reforzar seguridad."}
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Estado</span>
          <p className={`mt-1 text-sm font-semibold ${pinHash ? "text-[#166534]" : "text-[var(--text-secondary)]"}`}>
            {pinHash ? "PIN activo" : "PIN inactivo"}
          </p>
        </div>

        {pinHash && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">PIN actual</span>
            <input
              type="password"
              inputMode="numeric"
              value={currentPin}
              onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
              className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-semibold tracking-[0.3em] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
              placeholder="••••"
              maxLength={4}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {pinHash ? "Nuevo PIN" : "PIN"}
          </span>
          <input
            type="password"
            inputMode="numeric"
            value={nextPin}
            onChange={(event) => setNextPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-semibold tracking-[0.3em] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
            placeholder="••••"
            maxLength={4}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Confirmar PIN</span>
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-semibold tracking-[0.3em] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
            placeholder="••••"
            maxLength={4}
          />
        </label>

        {error && (
          <span className="rounded-lg bg-[#FEF2F2] px-2.5 py-2 text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          {pinHash && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                void handleRemove();
              }}
              className="rounded-xl border border-[#FCA5A5] px-3 py-2 text-xs font-semibold text-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Desactivar PIN
            </button>
          )}
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              void handleSave();
            }}
            className="rounded-xl bg-[var(--text-primary)] px-3 py-2 text-xs font-semibold text-[var(--panel-bg)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : pinHash ? "Actualizar PIN" : "Activar PIN"}
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
