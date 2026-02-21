import { useEffect, useMemo, useState } from "react";
import type { AppSettings } from "@/types";
import { PhosphorIcon } from "@/components/PhosphorIcon/PhosphorIcon";
import { SettingsModalShell } from "../SettingsModalShell";

const AVATAR_ICONS = ["user", "smiley", "user-circle", "star", "rocket-launch"] as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface EditProfilePopupProps {
  isOpen: boolean;
  profile: AppSettings["profile"];
  onClose: () => void;
  onSave: (profile: AppSettings["profile"]) => Promise<void>;
}

export function EditProfilePopup({
  isOpen,
  profile,
  onClose,
  onSave,
}: EditProfilePopupProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [avatarIcon, setAvatarIcon] = useState(profile.avatarIcon);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(profile.name);
    setEmail(profile.email);
    setAvatarIcon(profile.avatarIcon);
    setError(null);
    setIsSaving(false);
  }, [isOpen, profile]);

  const normalizedName = name.trim() || "Tu nombre";
  const normalizedEmail = email.trim() || "tu@email.com";
  const canSave = name.trim().length > 0 && EMAIL_PATTERN.test(email.trim()) && !isSaving;

  const profileInitials = useMemo(
    () => normalizedName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U",
    [normalizedName],
  );

  const handleSave = async (): Promise<void> => {
    const finalName = name.trim();
    const finalEmail = email.trim();

    if (!finalName) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!EMAIL_PATTERN.test(finalEmail)) {
      setError("Ingresa un email válido.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSave({
        name: finalName,
        email: finalEmail,
        avatarIcon,
      });
    } catch {
      setError("No pudimos guardar los cambios del perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Editar perfil"
      subtitle="Estos datos se usan globalmente en la app."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] px-3 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--text-primary)] text-sm font-bold text-[var(--panel-bg)]">
            {profileInitials}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{normalizedName}</span>
            <span className="block truncate text-xs font-medium text-[var(--text-secondary)]">{normalizedEmail}</span>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
            placeholder="Tu nombre"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
            placeholder="tu@email.com"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Avatar</span>
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_ICONS.map((iconName) => {
              const isSelected = iconName === avatarIcon;

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setAvatarIcon(iconName)}
                  className={`flex items-center justify-center rounded-xl border p-2 transition ${
                    isSelected
                      ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--panel-bg)]"
                      : "border-[var(--surface-border)] bg-[var(--panel-bg)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                  }`}
                  aria-pressed={isSelected}
                >
                  <PhosphorIcon name={iconName} size="text-[18px]" />
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <span className="rounded-lg bg-[#FEF2F2] px-2.5 py-2 text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--surface-border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              void handleSave();
            }}
            className="rounded-xl bg-[var(--text-primary)] px-3 py-2 text-xs font-semibold text-[var(--panel-bg)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
