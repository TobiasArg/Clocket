import { Suspense, lazy, useEffect } from "react";
import { useAppSettings } from "@/hooks";
import { Home } from "@/pages/Home/Home";
import {
  type AppPath,
  extractBudgetId,
  extractGoalId,
  toBudgetDetailPath,
  toGoalDetailPath,
} from "./routes";

const AccountsLazy = lazy(async () => {
  const module = await import("@/pages/Accounts/Accounts");
  return { default: module.Accounts };
});

const BudgetDetailLazy = lazy(async () => {
  const module = await import("@/pages/BudgetDetail/BudgetDetail");
  return { default: module.BudgetDetail };
});

const BudgetsLazy = lazy(async () => {
  const module = await import("@/pages/Budgets/Budgets");
  return { default: module.Budgets };
});

const CategoriesLazy = lazy(async () => {
  const module = await import("@/pages/Categories/Categories");
  return { default: module.Categories };
});

const GoalDetailLazy = lazy(async () => {
  const module = await import("@/pages/Goals/GoalDetail");
  return { default: module.GoalDetail };
});

const GoalsLazy = lazy(async () => {
  const module = await import("@/pages/Goals/Goals");
  return { default: module.Goals };
});

const HomeDesktopLazy = lazy(async () => {
  const module = await import("@/pages/HomeDesktop/HomeDesktop");
  return { default: module.HomeDesktop };
});

const InvestmentsLazy = lazy(async () => {
  const module = await import("@/pages/Investments/Investments");
  return { default: module.Investments };
});

const MoreLazy = lazy(async () => {
  const module = await import("@/pages/More/More");
  return { default: module.More };
});

const PlansLazy = lazy(async () => {
  const module = await import("@/pages/Plans/Plans");
  return { default: module.Plans };
});

const SettingsLazy = lazy(async () => {
  const module = await import("@/pages/Settings/Settings");
  return { default: module.Settings };
});

const StatisticsLazy = lazy(async () => {
  const module = await import("@/pages/Statistics/Statistics");
  return { default: module.Statistics };
});

const TransactionsLazy = lazy(async () => {
  const module = await import("@/pages/Transactions/Transactions");
  return { default: module.Transactions };
});

const goBack = () => window.history.back();

interface AppRouterProps {
  currentPath: AppPath;
  navigateTo: (path: AppPath) => void;
}

function RouterFallback({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white px-5">
      <span className="text-sm font-medium text-[#71717A]">{label}</span>
    </div>
  );
}

export function AppRouter({ currentPath, navigateTo }: AppRouterProps) {
  const { settings } = useAppSettings();
  const profile = settings?.profile;
  const userName = profile?.name?.trim() || "Usuario";
  const avatarInitials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const desktopUser = {
    initial: avatarInitials,
    name: userName,
    email: profile?.email?.trim() || "usuario@email.com",
  };

  useEffect(() => {
    if (currentPath !== "/" && currentPath !== "/home") {
      return;
    }

    const prefetch = () => {
      void import("@/pages/Transactions/Transactions");
      void import("@/pages/Settings/Settings");
      void import("@/pages/Budgets/Budgets");
      void import("@/pages/Investments/Investments");
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prefetch, { timeout: 1200 });
      return () => {
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(prefetch, 300);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentPath]);

  const goalId = extractGoalId(currentPath);
  if (goalId) {
    return (
      <Suspense fallback={<RouterFallback />}>
        <GoalDetailLazy goalId={goalId} onBackClick={goBack} />
      </Suspense>
    );
  }

  const budgetId = extractBudgetId(currentPath);
  if (budgetId) {
    return (
      <Suspense fallback={<RouterFallback />}>
        <BudgetDetailLazy budgetId={budgetId} onBackClick={goBack} />
      </Suspense>
    );
  }

  switch (currentPath) {
    case "/":
    case "/home":
      return (
        <Home
          avatarInitials={avatarInitials}
          userName={userName}
          onSeeAllTransactions={() => navigateTo("/transactions")}
          onSeeAllCuotas={() => navigateTo("/plans")}
          onGoalClick={(id) => navigateTo(toGoalDetailPath(id))}
        />
      );
    case "/transactions":
      return (
        <Suspense fallback={<RouterFallback />}>
          <TransactionsLazy onBackClick={goBack} onTransactionClick={() => undefined} />
        </Suspense>
      );
    case "/accounts":
      return (
        <Suspense fallback={<RouterFallback />}>
          <AccountsLazy onBackClick={goBack} />
        </Suspense>
      );
    case "/categories":
      return (
        <Suspense fallback={<RouterFallback />}>
          <CategoriesLazy onBackClick={goBack} />
        </Suspense>
      );
    case "/budgets":
      return (
        <Suspense fallback={<RouterFallback />}>
          <BudgetsLazy
            avatarInitials={avatarInitials}
            onBudgetClick={(id) => navigateTo(toBudgetDetailPath(id))}
          />
        </Suspense>
      );
    case "/budget-detail":
      return (
        <Suspense fallback={<RouterFallback />}>
          <BudgetDetailLazy onBackClick={goBack} />
        </Suspense>
      );
    case "/goals":
      return (
        <Suspense fallback={<RouterFallback />}>
          <GoalsLazy
            onBackClick={goBack}
            onGoalClick={(id) => navigateTo(toGoalDetailPath(id))}
          />
        </Suspense>
      );
    case "/investments":
      return (
        <Suspense fallback={<RouterFallback />}>
          <InvestmentsLazy avatarInitials={avatarInitials} />
        </Suspense>
      );
    case "/plans":
      return (
        <Suspense fallback={<RouterFallback />}>
          <PlansLazy onBackClick={goBack} />
        </Suspense>
      );
    case "/settings":
      return (
        <Suspense fallback={<RouterFallback />}>
          <SettingsLazy onBackClick={goBack} />
        </Suspense>
      );
    case "/statistics":
      return (
        <Suspense fallback={<RouterFallback label="Cargando estadísticas..." />}>
          <StatisticsLazy avatarInitials={avatarInitials} />
        </Suspense>
      );
    case "/more":
      return (
        <Suspense fallback={<RouterFallback />}>
          <MoreLazy onCloseClick={goBack} />
        </Suspense>
      );
    case "/home-desktop":
      return (
        <Suspense fallback={<RouterFallback />}>
          <HomeDesktopLazy
            user={desktopUser}
            greeting={`Hola, ${userName}`}
            headerTitle="Dashboard"
          />
        </Suspense>
      );
    default:
      return <Home avatarInitials={avatarInitials} userName={userName} />;
  }
}
