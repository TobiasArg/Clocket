import { useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, SettingsSection } from "@/types";
import {
  IconBadge,
  ListItemRow,
  PageHeader,
  PhosphorIcon,
  SettingsGroup,
} from "@/components";
import { useAppSettings } from "@/hooks";
import { applyTheme } from "@/utils";
import { CurrencyPopup } from "./popups/CurrencyPopup";
import { EditProfilePopup } from "./popups/EditProfilePopup";
import { ExportDataPopup } from "./popups/ExportDataPopup";
import { NotificationsPopup } from "./popups/NotificationsPopup";
import { SecurityPopup } from "./popups/SecurityPopup";
import { ThemePopup } from "./popups/ThemePopup";

type SettingsItemKey =
  | "edit-profile"
  | "currency"
  | "notifications"
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
          description: settings.currency === "USD" ? "USD - Dólar estadounidense" : "EUR - Euro",
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
  const matrix: SettingsItemKey[][] = [
    ["edit-profile"],
    ["currency", "notifications", "theme"],
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

  return (
    <div className="flex h-full w-full flex-col bg-[var(--panel-bg)] text-[var(--text-primary)]">
      <PageHeader title={headerTitle} onBackClick={handleHeaderBack} />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-5 py-2">
          {statusMessage && (
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">{statusMessage}</span>
            </div>
          )}

          {isLoading && !settings && (
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-4">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{errorLabel}</span>
            </div>
          )}

          {resolvedSections.map((section, sectionIndex) => (
            <SettingsGroup key={section.title} title={section.title}>
              {section.items.map((item, itemIndex) => (
                <ListItemRow
                  key={item.name}
                  left={(
                    <IconBadge
                      icon={item.icon}
                      size="w-[36px] h-[36px]"
                      rounded="rounded-[10px]"
                    />
                  )}
                  title={item.name}
                  subtitle={item.description}
                  titleClassName="text-[15px] font-semibold text-[var(--text-primary)] font-['Outfit']"
                  subtitleClassName="truncate text-xs font-medium text-[var(--text-secondary)]"
                  right={<PhosphorIcon name="caret-right" className="shrink-0 text-[#A1A1AA]" />}
                  onClick={() => {
                    handleItemClick(sectionIndex, itemIndex);
                  }}
                  showBorder={itemIndex < section.items.length - 1}
                  borderColor="border-[var(--surface-border)]"
                  padding="p-4"
                />
              ))}
            </SettingsGroup>
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

      <NotificationsPopup
        isOpen={openPopup === "notifications"}
        enabled={resolvedSettings.notificationsEnabled}
        onClose={closePopup}
        onSave={async (enabled) => {
          await updateSettings({ notificationsEnabled: enabled });
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
