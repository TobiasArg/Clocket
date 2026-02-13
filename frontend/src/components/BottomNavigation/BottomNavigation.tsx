import type { NavItem } from "@/types";
import { PhosphorIcon } from "@/components";

export interface BottomNavigationProps {
  items: NavItem[];
  activeColor?: string;
  onItemClick?: (index: number) => void;
}

export function BottomNavigation({
  items,
  activeColor = "text-black",
  onItemClick,
}: BottomNavigationProps) {
  return (
    <div className="border-t border-[#F4F4F5]">
      <div className="flex items-center h-[80px] px-4 bg-white">
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onItemClick?.(i)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            aria-label={item.label}
          >
            <PhosphorIcon
              name={item.icon}
              size="text-2xl"
              className={item.active ? activeColor : "text-[#A1A1AA]"}
            />
            <span
              className={`text-[10px] ${
                item.active
                  ? `font-semibold ${activeColor}`
                  : "font-medium text-[#A1A1AA]"
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
