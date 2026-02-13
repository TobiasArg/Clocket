import { HomeDesktop as HomeDesktopView } from "@/modules/home-desktop";
import type { HomeDesktopProps } from "@/modules/home-desktop";

export type { HomeDesktopProps } from "@/modules/home-desktop";

export function HomeDesktop(props: HomeDesktopProps) {
  return <HomeDesktopView {...props} />;
}
