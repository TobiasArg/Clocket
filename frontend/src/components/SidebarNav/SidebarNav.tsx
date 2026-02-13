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
          {navItems.map((item, i) => (
            <button
              type="button"
              key={item.label}
              onClick={() => onNavItemClick?.(i)}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-left ${
                item.active ? "bg-black" : ""
              }`}
            >
              <PhosphorIcon
                name={item.icon}
                className={item.active ? "text-white" : "text-[#71717A]"}
                size="text-[22px]"
              />
              <span className={`text-[15px] ${item.active ? "font-semibold text-white" : "font-medium text-[#71717A]"}`}>
                {item.label}
              </span>
            </button>
          ))}

          {navItemsBottom.length > 0 && (
            <>
              <Divider color="bg-[#E4E4E7]" />
              {navItemsBottom.map((item, i) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => onNavItemClick?.(navItems.length + i)}
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-left"
                >
                  <PhosphorIcon
                    name={item.icon}
                    className="text-[#71717A]"
                    size="text-[22px]"
                  />
                  <span className="text-[15px] font-medium text-[#71717A]">{item.label}</span>
                </button>
              ))}
            </>
          )}
        </nav>
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" className="flex items-center gap-3.5 px-4 py-3.5 rounded-[14px] text-left" aria-label="Goals">
          <PhosphorIcon name="target" className="text-[#71717A]" size="text-[22px]" />
          <span className="text-[15px] font-medium text-[#71717A]">Goals</span>
        </button>

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
