import type { NavItem } from "@/types";
import { navigateToPath } from "@/utils";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";

export interface BottomNavigationProps {
  items: NavItem[];
  activeColor?: string;
  onItemClick?: (index: number) => void;
}

export function BottomNavigation({
  items,
  activeColor = "text-[var(--text-primary)]",
  onItemClick,
}: BottomNavigationProps) {
  const currentPath =
    typeof window === "undefined" ? "/" : window.location.pathname || "/";

  const isPathActive = (to: string): boolean => {
    if (to === "/home" || to === "/") {
      return currentPath === "/home" || currentPath === "/";
    }

    return currentPath === to;
  };

  return (
    <div className="border-t border-[var(--surface-border)]">
      <div className="flex items-center h-[80px] px-4 bg-[var(--panel-bg)]">
        {items.map((item, i) => {
          const isActive = item.to ? isPathActive(item.to) : Boolean(item.active);
          const baseClassName =
            "flex flex-col items-center justify-center gap-1 flex-1 h-full";

          if (item.to) {
            return (
              <a
                key={item.label}
                href={item.to}
                onClick={(event) => {
                  event.preventDefault();
                  navigateToPath(item.to ?? "/home");
                  onItemClick?.(i);
                }}
                className={baseClassName}
                aria-label={item.label}
              >
                <PhosphorIcon
                  name={item.icon}
                  size="text-2xl"
                  className={isActive ? activeColor : "text-[var(--text-secondary)]"}
                />
                <span
                  className={`text-[10px] ${
                    isActive
                      ? `font-semibold ${activeColor}`
                      : "font-medium text-[var(--text-secondary)]"
                  }`}
                >
                  {item.label}
                </span>
              </a>
            );
          }

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onItemClick?.(i)}
              className={baseClassName}
              aria-label={item.label}
            >
              <PhosphorIcon
                name={item.icon}
                size="text-2xl"
                className={isActive ? activeColor : "text-[var(--text-secondary)]"}
              />
              <span
                className={`text-[10px] ${
                  isActive
                    ? `font-semibold ${activeColor}`
                    : "font-medium text-[var(--text-secondary)]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
