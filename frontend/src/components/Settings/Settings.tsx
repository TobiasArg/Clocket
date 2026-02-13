import { useMemo, useState } from "react";
import type { SettingsSection } from "@/types";
import {
  ActionButton,
  IconBadge,
  ListItemRow,
  PageHeader,
  PhosphorIcon,
  SettingsGroup,
} from "@/components";
import { useAppSettings } from "@/hooks";

export interface SettingsProps {
  headerTitle?: string;
  sections?: SettingsSection[];
  logoutIcon?: string;
  logoutLabel?: string;
  loadingLabel?: string;
  errorLabel?: string;
  savedLabel?: string;
  onBackClick?: () => void;
  onItemClick?: (sectionIndex: number, itemIndex: number) => void;
  onLogout?: () => void;
}

const getSectionsFromSettings = (settings: {
  currency: "USD" | "EUR";
  language: "es" | "en";
  notificationsEnabled: boolean;
  theme: "light";
}): SettingsSection[] => {
  return [
    {
      title: "PERFIL Y CUENTA",
      items: [
        { icon: "user", name: "Editar Perfil", description: "Nombre, foto, información personal" },
        { icon: "credit-card", name: "Cuentas y Tarjetas", description: "Gestionar efectivo, tarjetas, cuentas" },
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
          icon: "translate",
          name: "Idioma",
          description: settings.language === "es" ? "Español" : "English",
        },
        {
          icon: "bell",
          name: "Notificaciones",
          description: settings.notificationsEnabled ? "Activadas" : "Pausadas",
        },
        { icon: "moon", name: "Tema", description: "Claro" },
      ],
    },
    {
      title: "DATOS Y PRIVACIDAD",
      items: [
        { icon: "export", name: "Exportar Datos", description: "Descargar en CSV, PDF, Excel" },
        { icon: "cloud-arrow-up", name: "Backup y Sincronización", description: "iCloud, Google Drive" },
        { icon: "lock", name: "Seguridad", description: "PIN, Face ID, Touch ID" },
      ],
    },
    {
      title: "SOPORTE",
      items: [
        { icon: "question", name: "Ayuda y FAQ", description: "Preguntas frecuentes, tutoriales" },
        { icon: "file-text", name: "Términos y Privacidad", description: "Políticas y condiciones de uso" },
      ],
    },
  ];
};

export function Settings({
  headerTitle = "Settings",
  sections,
  logoutIcon = "sign-out",
  logoutLabel = "Cerrar Sesión",
  loadingLabel = "Cargando configuración...",
  errorLabel = "No pudimos cargar configuración. Intenta nuevamente.",
  savedLabel = "Guardado",
  onBackClick,
  onItemClick,
  onLogout,
}: SettingsProps) {
  const { settings, isLoading, error, update, reset } = useAppSettings();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const resolvedSettings = settings ?? {
    currency: "USD" as const,
    language: "es" as const,
    notificationsEnabled: true,
    theme: "light" as const,
  };

  const resolvedSections = useMemo(() => {
    return sections ?? getSectionsFromSettings(resolvedSettings);
  }, [resolvedSettings, sections]);

  const handleItemClick = async (sectionIndex: number, itemIndex: number): Promise<void> => {
    onItemClick?.(sectionIndex, itemIndex);

    if (sections) {
      return;
    }

    const item = resolvedSections[sectionIndex]?.items[itemIndex];
    if (!item) {
      return;
    }

    if (item.name === "Moneda") {
      const updated = await update({
        currency: resolvedSettings.currency === "USD" ? "EUR" : "USD",
      });
      if (updated) {
        setStatusMessage(savedLabel);
      }
      return;
    }

    if (item.name === "Idioma") {
      const updated = await update({
        language: resolvedSettings.language === "es" ? "en" : "es",
      });
      if (updated) {
        setStatusMessage(savedLabel);
      }
      return;
    }

    if (item.name === "Notificaciones") {
      const updated = await update({
        notificationsEnabled: !resolvedSettings.notificationsEnabled,
      });
      if (updated) {
        setStatusMessage(savedLabel);
      }
    }
  };

  const handleReset = async (): Promise<void> => {
    const resetSettings = await reset();
    if (resetSettings) {
      setStatusMessage(savedLabel);
    }

    onLogout?.();
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader title={headerTitle} onBackClick={onBackClick} />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-5 py-2">
          {statusMessage && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-2">
              <span className="text-xs font-medium text-[#71717A]">{statusMessage}</span>
            </div>
          )}

          {isLoading && !settings && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{loadingLabel}</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl bg-[#F4F4F5] px-4 py-4">
              <span className="text-sm font-medium text-[#71717A]">{errorLabel}</span>
            </div>
          )}

          {resolvedSections.map((section, sectionIndex) => (
            <SettingsGroup key={section.title} title={section.title}>
              {section.items.map((item, itemIndex) => (
                <ListItemRow
                  key={item.name}
                  left={
                    <IconBadge
                      icon={item.icon}
                      size="w-[36px] h-[36px]"
                      rounded="rounded-[10px]"
                    />
                  }
                  title={item.name}
                  subtitle={item.description}
                  titleClassName="text-[15px] font-semibold text-black font-['Outfit']"
                  subtitleClassName="text-xs font-medium text-[#71717A] truncate"
                  right={<PhosphorIcon name="caret-right" className="text-[#A1A1AA] shrink-0" />}
                  onClick={() => {
                    void handleItemClick(sectionIndex, itemIndex);
                  }}
                  showBorder={itemIndex < section.items.length - 1}
                  borderColor="border-[#E4E4E7]"
                  padding="p-4"
                />
              ))}
            </SettingsGroup>
          ))}

          <ActionButton
            icon={logoutIcon}
            label={logoutLabel}
            iconColor="text-[#DC2626]"
            labelColor="text-[#DC2626]"
            bg="bg-[#FEE2E2]"
            rounded="rounded-2xl"
            padding="p-4"
            onClick={() => {
              void handleReset();
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
