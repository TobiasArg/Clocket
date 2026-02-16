import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Accounts,
  BudgetDetail,
  Budgets,
  Categories,
  GoalDetail,
  Goals,
  Home,
  HomeDesktop,
  Investments,
  More,
  Plans,
  Settings,
  Transactions,
} from "@/pages";

type StaticAppPath =
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

type GoalDetailPath = `/goals/${string}`;
type BudgetDetailPath = `/budget-detail/${string}`;
type AppPath = StaticAppPath | GoalDetailPath | BudgetDetailPath;

const DEFAULT_PATH: StaticAppPath = "/home";

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

const normalizePath = (pathname: string): string => {
  if (!pathname) {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
};

const isStaticAppPath = (value: string): value is StaticAppPath => {
  return APP_PATHS.has(value as StaticAppPath);
};

const isGoalDetailPath = (value: string): value is GoalDetailPath => {
  if (!value.startsWith("/goals/")) {
    return false;
  }

  const goalId = value.slice("/goals/".length).trim();
  return goalId.length > 0;
};

const isBudgetDetailPath = (value: string): value is BudgetDetailPath => {
  if (!value.startsWith("/budget-detail/")) {
    return false;
  }

  const budgetId = value.slice("/budget-detail/".length).trim();
  return budgetId.length > 0;
};

const extractGoalId = (value: string): string | null => {
  if (!isGoalDetailPath(value)) {
    return null;
  }

  try {
    return decodeURIComponent(value.slice("/goals/".length));
  } catch {
    return null;
  }
};

const extractBudgetId = (value: string): string | null => {
  if (!isBudgetDetailPath(value)) {
    return null;
  }

  try {
    return decodeURIComponent(value.slice("/budget-detail/".length));
  } catch {
    return null;
  }
};

const resolvePathFromLocation = (): AppPath => {
  if (typeof window === "undefined") {
    return DEFAULT_PATH;
  }

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

const toGoalDetailPath = (goalId: string): GoalDetailPath =>
  `/goals/${encodeURIComponent(goalId)}`;

const toBudgetDetailPath = (budgetId: string): BudgetDetailPath =>
  `/budget-detail/${encodeURIComponent(budgetId)}`;

const StatisticsLazy = lazy(async () => {
  const module = await import("./pages/Statistics/Statistics");
  return { default: module.Statistics };
});

export function App() {
  const [currentPath, setCurrentPath] = useState<AppPath>(() =>
    resolvePathFromLocation(),
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(resolvePathFromLocation());
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (
      isStaticAppPath(normalized) ||
      isGoalDetailPath(normalized) ||
      isBudgetDetailPath(normalized)
    ) {
      setCurrentPath(normalized);
      return;
    }

    window.history.replaceState(null, "", DEFAULT_PATH);
    setCurrentPath(DEFAULT_PATH);
  }, []);

  const navigateTo = (path: AppPath, replace = false): void => {
    const normalized = normalizePath(window.location.pathname);
    if (normalized === path) {
      setCurrentPath(path);
      return;
    }

    if (replace) {
      window.history.replaceState(null, "", path);
    } else {
      window.history.pushState(null, "", path);
    }
    setCurrentPath(path);
  };

  const activeScreen = useMemo(() => {
    const goalId = extractGoalId(currentPath);
    if (goalId) {
      return (
        <GoalDetail
          goalId={goalId}
          onBackClick={() => navigateTo("/goals")}
        />
      );
    }

    const budgetId = extractBudgetId(currentPath);
    if (budgetId) {
      return (
        <BudgetDetail
          budgetId={budgetId}
          onBackClick={() => navigateTo("/budgets")}
        />
      );
    }

    switch (currentPath) {
      case "/":
      case "/home":
        return (
          <Home
            onMenuClick={() => navigateTo("/more")}
            onSeeAllTransactions={() => navigateTo("/transactions")}
            onSeeAllCuotas={() => navigateTo("/plans")}
            onGoalClick={(goalIdValue) => navigateTo(toGoalDetailPath(goalIdValue))}
          />
        );
      case "/transactions":
        return (
          <Transactions
            onBackClick={() => navigateTo("/home")}
            onTransactionClick={() => undefined}
          />
        );
      case "/accounts":
        return <Accounts onBackClick={() => navigateTo("/more")} />;
      case "/categories":
        return <Categories onBackClick={() => navigateTo("/more")} />;
      case "/budgets":
        return (
          <Budgets
            onBudgetClick={(budgetIdValue) => navigateTo(toBudgetDetailPath(budgetIdValue))}
          />
        );
      case "/budget-detail":
        return <BudgetDetail onBackClick={() => navigateTo("/budgets")} />;
      case "/goals":
        return (
          <Goals
            onGoalClick={(goalIdValue) => navigateTo(toGoalDetailPath(goalIdValue))}
          />
        );
      case "/investments":
        return <Investments />;
      case "/plans":
        return <Plans onBackClick={() => navigateTo("/more")} />;
      case "/settings":
        return <Settings onBackClick={() => navigateTo("/more")} />;
      case "/statistics":
        return (
          <Suspense
            fallback={(
              <div className="flex h-full w-full items-center justify-center bg-white px-5">
                <span className="text-sm font-medium text-[#71717A]">
                  Cargando estadísticas...
                </span>
              </div>
            )}
          >
            <StatisticsLazy />
          </Suspense>
        );
      case "/more":
        return <More onCloseClick={() => navigateTo("/home")} />;
      case "/home-desktop":
        return <HomeDesktop />;
      default:
        return <Home />;
    }
  }, [currentPath]);

  const isDesktopRoute = currentPath === "/home-desktop";
  const appShellClassName = isDesktopRoute
    ? "w-full max-w-[1280px] h-[860px] bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden"
    : "w-full max-w-[430px] h-[860px] bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden";

  return (
    <div className="min-h-screen w-screen bg-[#E4E4E7] flex flex-col items-center justify-start py-4 px-3">
      <div className={appShellClassName}>{activeScreen}</div>
    </div>
  );
}
