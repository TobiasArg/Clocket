import type { GridOption, NavItem } from "@/types";
import { BottomNavigation } from "@/components";
import { OptionGrid } from "@/components";
import { PageHeader } from "@/components";

export interface MoreProps {
  avatarInitials?: string;
  headerTitle?: string;
  gridRows?: GridOption[][];
  navItems?: NavItem[];
  onCloseClick?: () => void;
  onOptionClick?: (rowIndex: number, optionIndex: number) => void;
  onNavItemClick?: (index: number) => void;
}

export function More({
  avatarInitials = "JS",
  headerTitle = "Más",
  gridRows = [
    [
      { icon: "squares-four", label: "Categorías", to: "/categories" },
      { icon: "receipt", label: "Transacciones", to: "/transactions" },
    ],
    [
      { icon: "bank", label: "Cuentas", to: "/accounts" },
      { icon: "calendar", label: "Planes", to: "/plans" },
    ],
    [
      { icon: "gear", label: "Settings", to: "/settings" },
      { icon: "target", label: "Goals", to: "/goals" },
    ],
  ],
  navItems = [
    { icon: "house", label: "Home", to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-bar", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", to: "/investments" },
    { icon: "dots-three", label: "Más", active: true, to: "/more" },
  ],
  onCloseClick,
  onOptionClick,
  onNavItemClick,
}: MoreProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA]">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={onCloseClick}
        actionIcon="sign-out"
        actionAriaLabel="Salir"
        actionButtonClassName="bg-[#F4F4F5] border border-[#E4E4E7]"
        actionIconClassName="text-[#3F3F46]"
      />
      <div className="flex-1 overflow-auto px-5 py-8">
        <OptionGrid
          rows={gridRows}
          onOptionClick={onOptionClick}
          buttonBg="bg-white border border-[#E4E4E7]"
          iconColor="text-[#3F3F46]"
          labelClassName="text-base font-semibold text-[#27272A] font-['Outfit']"
          className="rounded-3xl"
        />
      </div>
      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
