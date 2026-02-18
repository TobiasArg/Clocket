import type { GridOption, NavItem } from "@/modules/more";
import {
  BottomNavigation,
  MoreOptionsWidget,
  PageHeader,
  useMorePageModel,
} from "@/modules/more";

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
  gridRows,
  navItems,
  onCloseClick,
  onOptionClick,
  onNavItemClick,
}: MoreProps) {
  const { resolvedGridRows, resolvedNavItems } = useMorePageModel({
    gridRows,
    navItems,
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#FAFAFA]">
      <PageHeader
        title={headerTitle}
        avatarInitials={avatarInitials}
        onActionClick={onCloseClick}
        actionIcon="x"
        actionAriaLabel="Cerrar"
        actionButtonClassName="bg-[#F4F4F5] border border-[#E4E4E7]"
        actionIconClassName="text-[#3F3F46]"
      />
      <div className="flex-1 overflow-auto px-5 py-8">
        <MoreOptionsWidget
          rows={resolvedGridRows}
          onOptionClick={onOptionClick}
        />
      </div>
      <BottomNavigation items={resolvedNavItems} onItemClick={onNavItemClick} />
    </div>
  );
}
