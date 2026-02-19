import { Suspense, lazy } from "react";
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
import {
  type AppPath,
  extractBudgetId,
  extractGoalId,
  toBudgetDetailPath,
  toGoalDetailPath,
} from "./routes";

const StatisticsLazy = lazy(async () => {
  const module = await import("@/pages/Statistics/Statistics");
  return { default: module.Statistics };
});

const goBack = () => window.history.back();

interface AppRouterProps {
  currentPath: AppPath;
  navigateTo: (path: AppPath) => void;
}

export function AppRouter({ currentPath, navigateTo }: AppRouterProps) {
  const goalId = extractGoalId(currentPath);
  if (goalId) {
    return <GoalDetail goalId={goalId} onBackClick={goBack} />;
  }

  const budgetId = extractBudgetId(currentPath);
  if (budgetId) {
    return <BudgetDetail budgetId={budgetId} onBackClick={goBack} />;
  }

  switch (currentPath) {
    case "/":
    case "/home":
      return (
        <Home
          onMenuClick={() => navigateTo("/more")}
          onSeeAllTransactions={() => navigateTo("/transactions")}
          onSeeAllCuotas={() => navigateTo("/plans")}
          onGoalClick={(id) => navigateTo(toGoalDetailPath(id))}
        />
      );
    case "/transactions":
      return <Transactions onBackClick={goBack} onTransactionClick={() => undefined} />;
    case "/accounts":
      return <Accounts onBackClick={goBack} />;
    case "/categories":
      return <Categories onBackClick={goBack} />;
    case "/budgets":
      return <Budgets onBudgetClick={(id) => navigateTo(toBudgetDetailPath(id))} />;
    case "/budget-detail":
      return <BudgetDetail onBackClick={goBack} />;
    case "/goals":
      return (
        <Goals
          onBackClick={goBack}
          onGoalClick={(id) => navigateTo(toGoalDetailPath(id))}
        />
      );
    case "/investments":
      return <Investments />;
    case "/plans":
      return <Plans onBackClick={goBack} />;
    case "/settings":
      return <Settings onBackClick={goBack} />;
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
      return <More onCloseClick={goBack} />;
    case "/home-desktop":
      return <HomeDesktop />;
    default:
      return <Home />;
  }
}
