export type StaticAppPath =
  | "/"
  | "/home"
  | "/accounts"
  | "/transactions"
  | "/categories"
  | "/budgets"
  | "/budget-detail"
  | "/goals"
  | "/investments"
  | "/plans"
  | "/settings"
  | "/statistics"
  | "/more"
  | "/home-desktop";

export type GoalDetailPath = `/goals/${string}`;
export type BudgetDetailPath = `/budget-detail/${string}`;
export type AppPath = StaticAppPath | GoalDetailPath | BudgetDetailPath;

export const DEFAULT_PATH: StaticAppPath = "/home";

const APP_PATHS = new Set<StaticAppPath>([
  "/",
  "/home",
  "/accounts",
  "/transactions",
  "/categories",
  "/budgets",
  "/budget-detail",
  "/goals",
  "/investments",
  "/plans",
  "/settings",
  "/statistics",
  "/more",
  "/home-desktop",
]);

export const normalizePath = (pathname: string): string => {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
};

export const isStaticAppPath = (value: string): value is StaticAppPath =>
  APP_PATHS.has(value as StaticAppPath);

export const isGoalDetailPath = (value: string): value is GoalDetailPath => {
  if (!value.startsWith("/goals/")) return false;
  return value.slice("/goals/".length).trim().length > 0;
};

export const isBudgetDetailPath = (value: string): value is BudgetDetailPath => {
  if (!value.startsWith("/budget-detail/")) return false;
  return value.slice("/budget-detail/".length).trim().length > 0;
};

export const extractGoalId = (value: string): string | null => {
  if (!isGoalDetailPath(value)) return null;
  try {
    return decodeURIComponent(value.slice("/goals/".length));
  } catch {
    return null;
  }
};

export const extractBudgetId = (value: string): string | null => {
  if (!isBudgetDetailPath(value)) return null;
  try {
    return decodeURIComponent(value.slice("/budget-detail/".length));
  } catch {
    return null;
  }
};

export const resolvePathFromLocation = (): AppPath => {
  if (typeof window === "undefined") return DEFAULT_PATH;
  const normalized = normalizePath(window.location.pathname);
  if (
    isStaticAppPath(normalized) ||
    isGoalDetailPath(normalized) ||
    isBudgetDetailPath(normalized)
  ) {
    return normalized;
  }
  return DEFAULT_PATH;
};

export const toGoalDetailPath = (goalId: string): GoalDetailPath =>
  `/goals/${encodeURIComponent(goalId)}`;

export const toBudgetDetailPath = (budgetId: string): BudgetDetailPath =>
  `/budget-detail/${encodeURIComponent(budgetId)}`;
