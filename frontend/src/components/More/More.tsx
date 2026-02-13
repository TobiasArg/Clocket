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
      { icon: "squares-four", label: "Categorías" },
      { icon: "receipt", label: "Transacciones" },
    ],
    [
      { icon: "calendar", label: "Planes" },
      { icon: "gear", label: "Settings" },
    ],
    [{ icon: "target", label: "Goals" }],
  ],
  navItems = [
    { icon: "house", label: "Home" },
    { icon: "wallet", label: "Budgets" },
    { icon: "chart-bar", label: "Statistics" },
    { icon: "trend-up", label: "Inversiones" },
    { icon: "dots-three", label: "Más", active: true },
  ],
  onCloseClick,
  onOptionClick,
  onNavItemClick,
}: MoreProps) {
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={onCloseClick}
        actionIcon="x"
      />
      <div className="flex-1 overflow-auto px-5 py-8">
        <OptionGrid rows={gridRows} onOptionClick={onOptionClick} />
      </div>
      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />
    </div>
  );
}
