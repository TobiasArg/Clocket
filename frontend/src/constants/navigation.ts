import type { NavItem } from "@/types";

/**
 * Single source of truth for the bottom navigation items.
 * Active state is resolved at runtime by BottomNavigation via URL matching,
 * so no `active` flag is needed here.
 */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { icon: "house", label: "Inicio", to: "/home" },
  { icon: "wallet", label: "Presupuestos", to: "/budgets" },
  { icon: "chart-bar", label: "Estadísticas", to: "/statistics" },
  { icon: "trend-up", label: "Inversiones", to: "/investments" },
  { icon: "dots-three", label: "Más", to: "/more" },
];
