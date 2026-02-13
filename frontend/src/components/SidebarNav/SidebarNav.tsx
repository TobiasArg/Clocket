import type { SidebarNavItem, UserProfile } from "@/types";
import { Avatar } from "@/components";
import { Divider } from "@/components";
import { PhosphorIcon } from "@/components";

export interface SidebarNavProps {
  logoInitial?: string;
  logoName?: string;
  navItems?: SidebarNavItem[];
  navItemsBottom?: SidebarNavItem[];
  user?: UserProfile;
  onNavItemClick?: (index: number) => void;
  className?: string;
}

export function SidebarNav({
  logoInitial = "F",
  logoName = "FinTrack",
  navItems = [],
  navItemsBottom = [],
  user,
  onNavItemClick,
  className = "",
}: SidebarNavProps) {
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
    <aside className={`flex flex-col justify-between w-[280px] shrink-0 bg-[#FAFAFA] p-6 pt-8 pb-8 h-full overflow-auto ${className}`}>
      <div className="flex flex-col gap-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-[40px] h-[40px] rounded-xl bg-black">
            <span className="text-xl font-black text-white font-['Outfit']">{logoInitial}</span>
          </div>
          <span className="text-[22px] font-extrabold text-black font-['Outfit']">{logoName}</span>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item, i) => {
            const isActive = item.to ? isPathActive(item.to) : Boolean(item.active);
            const rowClassName = `flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-left ${
              isActive ? "bg-black" : ""
            }`;

            if (item.to) {
              return (
                <a
                  key={item.label}
                  href={item.to}
                  onClick={(event) => {
                    event.preventDefault();
                    navigateToPath(item.to ?? "/home");
                    onNavItemClick?.(i);
                  }}
                  className={rowClassName}
                >
                  <PhosphorIcon
                    name={item.icon}
                    className={isActive ? "text-white" : "text-[#71717A]"}
                    size="text-[22px]"
                  />
                  <span className={`text-[15px] ${isActive ? "font-semibold text-white" : "font-medium text-[#71717A]"}`}>
                    {item.label}
                  </span>
                </a>
              );
            }

            return (
              <button
                type="button"
                key={item.label}
                onClick={() => onNavItemClick?.(i)}
                className={rowClassName}
              >
                <PhosphorIcon
                  name={item.icon}
                  className={isActive ? "text-white" : "text-[#71717A]"}
                  size="text-[22px]"
                />
                <span className={`text-[15px] ${isActive ? "font-semibold text-white" : "font-medium text-[#71717A]"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {navItemsBottom.length > 0 && (
            <>
              <Divider color="bg-[#E4E4E7]" />
              {navItemsBottom.map((item, i) => {
                const isActive = item.to ? isPathActive(item.to) : Boolean(item.active);
                const rowClassName = "flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-left";

                if (item.to) {
                  return (
                    <a
                      key={item.label}
                      href={item.to}
                      onClick={(event) => {
                        event.preventDefault();
                        navigateToPath(item.to ?? "/home");
                        onNavItemClick?.(navItems.length + i);
                      }}
                      className={rowClassName}
                    >
                      <PhosphorIcon
                        name={item.icon}
                        className={isActive ? "text-black" : "text-[#71717A]"}
                        size="text-[22px]"
                      />
                      <span className={`text-[15px] ${isActive ? "font-semibold text-black" : "font-medium text-[#71717A]"}`}>
                        {item.label}
                      </span>
                    </a>
                  );
                }

                return (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => onNavItemClick?.(navItems.length + i)}
                    className={rowClassName}
                  >
                    <PhosphorIcon
                      name={item.icon}
                      className="text-[#71717A]"
                      size="text-[22px]"
                    />
                    <span className="text-[15px] font-medium text-[#71717A]">{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <a
          href="/goals"
          onClick={(event) => {
            event.preventDefault();
            navigateToPath("/goals");
          }}
          className="flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-left"
          aria-label="Goals"
        >
          <PhosphorIcon name="target" className="text-[#71717A]" size="text-[22px]" />
          <span className="text-[15px] font-medium text-[#71717A]">Goals</span>
        </a>

        {user && (
          <div className="flex items-center gap-3 bg-white rounded-[14px] p-4">
            <Avatar
              initials={user.initial}
              bg="bg-black"
              size="w-[44px] h-[44px]"
              textSize="text-lg"
              fontWeight="font-bold"
              className="shrink-0"
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-semibold text-black truncate">{user.name}</span>
              <span className="text-xs font-normal text-[#71717A] truncate">{user.email}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
