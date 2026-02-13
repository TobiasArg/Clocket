import { useEffect, useMemo, useState } from "react";
import {
  BudgetDetail,
  Budgets,
  Categories,
  Goals,
  Home,
  HomeDesktop,
  Investments,
  More,
  Plans,
  Settings,
  Statistics,
  Transactions,
} from "@/pages";

type AppPath =
  | "/"
  | "/home"
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

const DEFAULT_PATH: AppPath = "/home";

const APP_PATHS = new Set<AppPath>([
  "/",
  "/home",
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

const isAppPath = (value: string): value is AppPath => {
  return APP_PATHS.has(value as AppPath);
};

const resolvePathFromLocation = (): AppPath => {
  if (typeof window === "undefined") {
    return DEFAULT_PATH;
  }

  const normalized = normalizePath(window.location.pathname);
  if (isAppPath(normalized)) {
    return normalized;
  }

  return DEFAULT_PATH;
};

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
    if (isAppPath(normalized)) {
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
    switch (currentPath) {
      case "/":
      case "/home":
        return (
          <Home
            onMenuClick={() => navigateTo("/more")}
            onSeeAllTransactions={() => navigateTo("/transactions")}
            onSeeAllCuotas={() => navigateTo("/plans")}
          />
        );
      case "/transactions":
        return (
          <Transactions
            onBackClick={() => navigateTo("/home")}
            onTransactionClick={() => undefined}
          />
        );
      case "/categories":
        return <Categories onBackClick={() => navigateTo("/more")} />;
      case "/budgets":
        return <Budgets onBudgetClick={() => navigateTo("/budget-detail")} />;
      case "/budget-detail":
        return <BudgetDetail onBackClick={() => navigateTo("/budgets")} />;
      case "/goals":
        return <Goals />;
      case "/investments":
        return <Investments />;
      case "/plans":
        return <Plans onBackClick={() => navigateTo("/more")} />;
      case "/settings":
        return <Settings onBackClick={() => navigateTo("/more")} />;
      case "/statistics":
        return <Statistics />;
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
