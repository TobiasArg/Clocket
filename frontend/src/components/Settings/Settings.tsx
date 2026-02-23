import { useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, SettingsSection } from "@/types";
import {
  ListItemRow,
  PageHeader,
  PhosphorIcon,
} from "@/components";
import { useAppSettings } from "@/hooks";
import { applyTheme } from "@/utils";
import { IconBadge } from "../IconBadge/IconBadge";
import { CurrencyPopup } from "./popups/CurrencyPopup";
import { EditProfilePopup } from "./popups/EditProfilePopup";
import { ExportDataPopup } from "./popups/ExportDataPopup";
import { SecurityPopup } from "./popups/SecurityPopup";
import { ThemePopup } from "./popups/ThemePopup";

type SettingsItemKey =
  | "edit-profile"
  | "currency"
  | "theme"
  | "export"
  | "security";

export interface SettingsProps {
  headerTitle?: string;
  sections?: SettingsSection[];
  loadingLabel?: string;
  errorLabel?: string;
  savedLabel?: string;
  onBackClick?: () => void;
  onItemClick?: (sectionIndex: number, itemIndex: number) => void;
  onLogout?: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: "USD",
  language: "es",
  notificationsEnabled: true,
  theme: "light",
  profile: {
    name: "Usuario",
    email: "usuario@email.com",
    avatarIcon: "user",
  },
  security: {
    pinHash: null,
  },
};

const getSectionsFromSettings = (settings: AppSettings): SettingsSection[] => {
  const themeLabel = settings.theme === "dark" ? "Oscuro" : "Claro";

  return [
    {
      title: "PERFIL Y CUENTA",
      items: [
        {
          icon: settings.profile.avatarIcon,
          name: "Editar Perfil",
          description: `${settings.profile.name} · ${settings.profile.email}`,
        },
      ],
    },
    {
      title: "CONFIGURACIÓN",
      items: [
        {
          icon: "currency-dollar",
          name: "Moneda",
          description: settings.currency === "USD" ? "USD - Dólar estadounidense" : "ARS - Peso argentino",
        },
        {
          icon: "bell",
          name: "Notificaciones",
          description: settings.notificationsEnabled ? "Activadas" : "Pausadas",
        },
        {
          icon: "moon",
          name: "Tema",
          description: themeLabel,
        },
      ],
    },
    {
      title: "DATOS Y PRIVACIDAD",
      items: [
        {
          icon: "export",
          name: "Exportar Datos",
          description: "Descargar backup JSON y CSV",
        },
        {
          icon: "lock",
          name: "Seguridad",
          description: settings.security.pinHash ? "PIN activo" : "PIN inactivo",
        },
      ],
    },
  ];
};

const getItemKey = (sectionIndex: number, itemIndex: number): SettingsItemKey | null => {
  const matrix: Array<Array<SettingsItemKey | null>> = [
    ["edit-profile"],
    ["currency", null, "theme"],
    ["export", "security"],
  ];

  return matrix[sectionIndex]?.[itemIndex] ?? null;
};

export function Settings({
  headerTitle = "Settings",
  sections,
  loadingLabel = "Cargando configuración...",
  errorLabel = "No pudimos cargar configuración. Intenta nuevamente.",
  savedLabel = "Guardado",
  onBackClick,
  onItemClick,
}: SettingsProps) {
  const { settings, isLoading, error, update } = useAppSettings();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [openPopup, setOpenPopup] = useState<SettingsItemKey | null>(null);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const popupHistoryActiveRef = useRef(false);

  const resolvedSettings = settings ?? DEFAULT_SETTINGS;

  const resolvedSections = useMemo(() => {
    return sections ?? getSectionsFromSettings(resolvedSettings);
  }, [resolvedSettings, sections]);

  const closePopup = (): void => {
    if (openPopup && popupHistoryActiveRef.current) {
      window.history.back();
      return;
    }

    setOpenPopup(null);
  };

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    window.history.pushState({ settingsPopup: true }, "");
    popupHistoryActiveRef.current = true;

    const onPopState = (): void => {
      if (!popupHistoryActiveRef.current) {
        return;
      }

      popupHistoryActiveRef.current = false;
      setOpenPopup(null);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [openPopup]);

  const handleHeaderBack = (): void => {
    if (openPopup) {
      closePopup();
      return;
    }

    onBackClick?.();
  };

  const updateSettings = async (
    patch: Parameters<typeof update>[0],
    message: string = savedLabel,
  ): Promise<void> => {
    const updated = await update(patch);
    if (!updated) {
      return;
    }

    if (patch.theme) {
      applyTheme(patch.theme);
    }

    setStatusMessage(message);
    closePopup();
  };

  const handleItemClick = (sectionIndex: number, itemIndex: number): void => {
    onItemClick?.(sectionIndex, itemIndex);

    if (sections) {
      return;
    }

    const itemKey = getItemKey(sectionIndex, itemIndex);
    if (!itemKey) {
      return;
    }

    setOpenPopup(itemKey);
  };

  const handleNotificationsToggle = async (): Promise<void> => {
    if (isTogglingNotifications) {
      return;
    }

    setIsTogglingNotifications(true);
    try {
      const next = !resolvedSettings.notificationsEnabled;
      await updateSettings(
        { notificationsEnabled: next },
        next ? "Notificaciones activadas" : "Notificaciones pausadas",
      );
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--panel-bg)] text-[var(--text-primary)]">
      <PageHeader title={headerTitle} onBackClick={handleHeaderBack} />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-5 py-2">
          {statusMessage && (
            <div className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4 py-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">{statusMessage}</span>
            </div>
          )}

          {isLoading && !settings && (
            <div className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
            </div>
          )}

          {resolvedSections.map((section, sectionIndex) => (
            <section key={section.title} className="flex flex-col gap-2">
              <span className="mb-1 text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]">
                {section.title}
              </span>
              <div className="flex flex-col gap-2">
                {section.items.map((item, itemIndex) => {
                  const isNotificationsItem = !sections && sectionIndex === 1 && itemIndex === 1;

                  const rightNode = isNotificationsItem ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={resolvedSettings.notificationsEnabled}
                      aria-label="Alternar notificaciones"
                      disabled={isTogglingNotifications}
                      onClick={() => {
                        void handleNotificationsToggle();
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full p-0.5 transition ${
                        resolvedSettings.notificationsEnabled ? "bg-[#22C55E]" : "bg-[var(--surface-border)]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span
                        className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
                          resolvedSettings.notificationsEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  ) : (
                    <PhosphorIcon name="caret-right" className="shrink-0 text-[var(--text-secondary)]" />
                  );

                  return (
                    <ListItemRow
                      key={item.name}
                      left={(
                        <IconBadge
                          icon={item.icon}
                          iconColor="text-[var(--panel-bg)]"
                          size="w-[36px] h-[36px]"
                          rounded="rounded-[10px]"
                        />
                      )}
                      title={item.name}
                      subtitle={item.description}
                      titleClassName="text-[15px] font-semibold text-[var(--text-primary)] font-['Outfit']"
                      subtitleClassName="truncate text-xs font-medium text-[var(--text-secondary)]"
                      right={rightNode}
                      onClick={isNotificationsItem ? undefined : () => {
                        handleItemClick(sectionIndex, itemIndex);
                      }}
                      padding="py-4"
                      className="clocket-glass-card rounded-2xl bg-[var(--surface-muted)] px-4"
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <EditProfilePopup
        isOpen={openPopup === "edit-profile"}
        profile={resolvedSettings.profile}
        onClose={closePopup}
        onSave={async (profile) => {
          await updateSettings({ profile });
        }}
      />

      <CurrencyPopup
        isOpen={openPopup === "currency"}
        currentCurrency={resolvedSettings.currency}
        onClose={closePopup}
        onSave={async (currency) => {
          await updateSettings({ currency });
        }}
      />

      <ThemePopup
        isOpen={openPopup === "theme"}
        currentTheme={resolvedSettings.theme}
        onClose={closePopup}
        onSave={async (theme) => {
          await updateSettings({ theme });
        }}
      />

      <ExportDataPopup
        isOpen={openPopup === "export"}
        onClose={closePopup}
        onExportSuccess={(message) => {
          setStatusMessage(message);
          closePopup();
        }}
      />

      <SecurityPopup
        isOpen={openPopup === "security"}
        pinHash={resolvedSettings.security.pinHash}
        onClose={closePopup}
        onSavePinHash={async (pinHash) => {
          await updateSettings({ security: { pinHash } });
        }}
      />
    </div>
  );
}
