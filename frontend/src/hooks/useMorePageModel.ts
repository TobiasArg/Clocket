import { useMemo } from "react";
import { DEFAULT_NAV_ITEMS } from "@/constants";
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
    { icon: "target", label: "Metas", to: "/goals" },
    { icon: "gear", label: "Configuración", to: "/settings" },
  ],
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
