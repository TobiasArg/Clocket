import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(profile.name);
    setEmail(profile.email);
    setAvatarIcon(profile.avatarIcon);
    setError(null);
  }, [isOpen, profile]);

  const handleSave = async (): Promise<void> => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Ingresa un email válido.");
      return;
    }

    await onSave({
      name: normalizedName,
      email: normalizedEmail,
      avatarIcon,
    });
  };

  return (
    <SettingsModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Editar perfil"
      subtitle="Actualiza nombre, email e icono de perfil"
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[#3F3F46]">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm font-medium text-[#111827]"
            placeholder="Tu nombre"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[#3F3F46]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm font-medium text-[#111827]"
            placeholder="tu@email.com"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[#3F3F46]">Icono</span>
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_ICONS.map((iconName) => {
              const isSelected = iconName === avatarIcon;

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setAvatarIcon(iconName)}
                  className={`flex items-center justify-center rounded-xl border p-2 ${
                    isSelected
                      ? "border-[#111827] bg-[#111827] text-white"
                      : "border-[#E4E4E7] bg-white text-[#3F3F46]"
                  }`}
                >
                  <PhosphorIcon name={iconName} size="text-[20px]" />
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <span className="text-xs font-semibold text-[#B91C1C]">{error}</span>
        )}

        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold text-[#71717A]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            className="rounded-xl bg-[#18181B] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Guardar
          </button>
        </div>
      </div>
    </SettingsModalShell>
  );
}
