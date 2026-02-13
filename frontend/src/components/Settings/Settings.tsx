import type { SettingsSection } from "@/types";
import { ActionButton } from "@/components";
import { IconBadge } from "@/components";
import { PhosphorIcon } from "@/components";
import { ListItemRow } from "@/components";
import { PageHeader } from "@/components";
import { SettingsGroup } from "@/components";

export interface SettingsProps {
  headerTitle?: string;
  sections?: SettingsSection[];
  logoutIcon?: string;
  logoutLabel?: string;
  onBackClick?: () => void;
  onItemClick?: (sectionIndex: number, itemIndex: number) => void;
  onLogout?: () => void;
}

export function Settings({
  headerTitle = "Settings",
  sections = [
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
        { icon: "currency-dollar", name: "Moneda", description: "USD - Dólar estadounidense" },
        { icon: "translate", name: "Idioma", description: "Español" },
        { icon: "bell", name: "Notificaciones", description: "Recordatorios, alertas de gastos" },
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
  ],
  logoutIcon = "sign-out",
  logoutLabel = "Cerrar Sesión",
  onBackClick,
  onItemClick,
  onLogout,
}: SettingsProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader title={headerTitle} onBackClick={onBackClick} />
      <div className="flex-1 overflow-auto">
        <div className="flex flex-col gap-6 px-5 py-2">
          {sections.map((section, si) => (
            <SettingsGroup key={section.title} title={section.title}>
              {section.items.map((item, ii) => (
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
                  onClick={() => onItemClick?.(si, ii)}
                  showBorder={ii < section.items.length - 1}
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
            onClick={onLogout}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
