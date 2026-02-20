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
      subtitle={pinHash ? "PIN activo" : "PIN inactivo"}
    >
      <div className="flex flex-col gap-3">
        {pinHash && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#3F3F46]">PIN actual</span>
            <input
              type="password"
              inputMode="numeric"
              value={currentPin}
              onChange={(event) => setCurrentPin(event.target.value)}
              className="rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm font-medium text-[#111827]"
              placeholder="••••"
              maxLength={4}
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[#3F3F46]">
            {pinHash ? "Nuevo PIN" : "PIN"}
          </span>
          <input
            type="password"
            inputMode="numeric"
            value={nextPin}
            onChange={(event) => setNextPin(event.target.value)}
            className="rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm font-medium text-[#111827]"
            placeholder="••••"
            maxLength={4}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[#3F3F46]">Confirmar PIN</span>
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value)}
            className="rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm font-medium text-[#111827]"
            placeholder="••••"
            maxLength={4}
          />
        </label>

        {error && (
          <span className="text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          {pinHash && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                void handleRemove();
              }}
              className="rounded-xl border border-[#FCA5A5] px-3 py-1.5 text-xs font-semibold text-[#B91C1C]"
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
            className="rounded-xl bg-[#18181B] px-3 py-1.5 text-xs font-semibold text-white"
          >
            {isSaving ? "Guardando..." : pinHash ? "Actualizar PIN" : "Activar PIN"}
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
