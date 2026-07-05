import { useEffect, useState } from "react";
import { hashPin, isValidPin } from "@/utils";
import { SettingsModalShell } from "../SettingsModalShell";

export interface SecurityPopupProps {
  hasPin: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSavePinHash: (pinHash: string | null, currentPinHash?: string | null) => Promise<void>;
}

export function SecurityPopup({
  hasPin,
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

    if (hasPin && !isValidPin(currentPin)) {
      setError("Ingresa el PIN actual de 4 dígitos.");
      return;
    }

    if (nextPin !== confirmPin) {
      setError("La confirmación no coincide.");
      return;
    }

    setIsSaving(true);

    try {
      const nextHash = await hashPin(nextPin);
      const currentHash = hasPin ? await hashPin(currentPin) : undefined;
      await onSavePinHash(nextHash, currentHash);
    } catch {
      setError("No pudimos guardar el PIN.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!hasPin) {
      return;
    }

    setError(null);
    if (!isValidPin(currentPin)) {
      setError("Ingresa el PIN actual de 4 dígitos.");
      return;
    }

    setIsSaving(true);

    try {
      await onSavePinHash(null, await hashPin(currentPin));
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
      subtitle={hasPin ? "PIN local activo para controles de esta app." : "Activa un PIN local para controles de esta app."}
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Estado</span>
          <p className={`mt-1 text-sm font-semibold ${hasPin ? "text-[#166534]" : "text-[var(--text-secondary)]"}`}>
            {hasPin ? "PIN local activo" : "PIN local inactivo"}
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
            No reemplaza autenticación de cuenta ni cifrado de backups.
          </p>
        </div>

        {hasPin && (
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
            {hasPin ? "Nuevo PIN" : "PIN"}
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
          {hasPin && (
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
            {isSaving ? "Guardando..." : hasPin ? "Actualizar PIN" : "Activar PIN"}
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
