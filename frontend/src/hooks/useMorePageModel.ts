import { useMemo } from "react";
import type { GridOption, NavItem } from "@/types";

export interface UseMorePageModelOptions {
  gridRows?: GridOption[][];
  navItems?: NavItem[];
}

export interface UseMorePageModelResult {
  resolvedGridRows: GridOption[][];
  resolvedNavItems: NavItem[];
}

const DEFAULT_GRID_ROWS: GridOption[][] = [
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
];

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { icon: "house", label: "Home", to: "/home" },
  { icon: "wallet", label: "Budgets", to: "/budgets" },
  { icon: "chart-bar", label: "Statistics", to: "/statistics" },
  { icon: "trend-up", label: "Inversiones", to: "/investments" },
  { icon: "dots-three", label: "Más", active: true, to: "/more" },
];

export const useMorePageModel = (
  options: UseMorePageModelOptions = {},
): UseMorePageModelResult => {
  const { gridRows, navItems } = options;

  const resolvedGridRows = useMemo(() => gridRows ?? DEFAULT_GRID_ROWS, [gridRows]);
  const resolvedNavItems = useMemo(() => navItems ?? DEFAULT_NAV_ITEMS, [navItems]);

  return {
    resolvedGridRows,
    resolvedNavItems,
  };
};
