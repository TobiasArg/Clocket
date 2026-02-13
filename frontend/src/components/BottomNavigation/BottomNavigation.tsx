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
  const currentPath =
    typeof window === "undefined" ? "/" : window.location.pathname || "/";

  const isPathActive = (to: string): boolean => {
    if (to === "/home" || to === "/") {
      return currentPath === "/home" || currentPath === "/";
    }

    return currentPath === to;
  };

  const navigateToPath = (to: string): void => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.pathname === to) {
      return;
    }

    window.history.pushState(null, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div className="border-t border-[#F4F4F5]">
      <div className="flex items-center h-[80px] px-4 bg-white">
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
                  className={isActive ? activeColor : "text-[#A1A1AA]"}
                />
                <span
                  className={`text-[10px] ${
                    isActive
                      ? `font-semibold ${activeColor}`
                      : "font-medium text-[#A1A1AA]"
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
                className={isActive ? activeColor : "text-[#A1A1AA]"}
              />
              <span
                className={`text-[10px] ${
                  isActive
                    ? `font-semibold ${activeColor}`
                    : "font-medium text-[#A1A1AA]"
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
