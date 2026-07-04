import { useCallback, useEffect, useMemo, useState } from "react";
import {
  goalsRepository,
  type CreateGoalInput,
  type GoalDeleteResolutionInput,
  type GoalDeleteResolutionResult,
  type GoalPlanItem,
  type GoalsRepository,
  type UpdateGoalPatch,
} from "@/utils";
import { useCurrency } from "./useCurrency";

export interface UseGoalsOptions {
  repository?: GoalsRepository;
}

export interface UseGoalsResult {
  items: GoalPlanItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateGoalInput) => Promise<GoalPlanItem | null>;
  update: (id: string, patch: UpdateGoalPatch) => Promise<GoalPlanItem | null>;
  resolveDeletion: (id: string, input: GoalDeleteResolutionInput) => Promise<GoalDeleteResolutionResult | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE =
  "We couldn't complete that goal action. Please try again.";

let sharedGoalsCache: GoalPlanItem[] | null = null;
let sharedGoalsCacheCurrency: "USD" | "ARS" | null = null;
let sharedGoalsRefreshPromise: Promise<GoalPlanItem[]> | null = null;
let sharedGoalsRefreshCurrency: "USD" | "ARS" | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useGoals = (options: UseGoalsOptions = {}): UseGoalsResult => {
  const { currency: appCurrency } = useCurrency();
  const repository = useMemo(
    () => options.repository ?? goalsRepository,
    [options.repository],
  );
  const isSharedRepository = repository === goalsRepository;

  const [items, setItems] = useState<GoalPlanItem[]>(() => (
    isSharedRepository && sharedGoalsCache !== null && sharedGoalsCacheCurrency === appCurrency
      ? sharedGoalsCache
      : []
  ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async (force: boolean) => {
    if (
      isSharedRepository &&
      !force &&
      sharedGoalsCache !== null &&
      sharedGoalsCacheCurrency === appCurrency
    ) {
      setItems(sharedGoalsCache);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let request: Promise<GoalPlanItem[]>;
    if (isSharedRepository) {
      if (!sharedGoalsRefreshPromise || sharedGoalsRefreshCurrency !== appCurrency) {
        sharedGoalsRefreshPromise = repository.list(appCurrency);
        sharedGoalsRefreshCurrency = appCurrency;
      }
      request = sharedGoalsRefreshPromise;
    } else {
      request = repository.list(appCurrency);
    }

    try {
      const nextItems = await request;
      if (isSharedRepository) {
        sharedGoalsCache = nextItems;
        sharedGoalsCacheCurrency = appCurrency;
      }
      setItems(nextItems);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (isSharedRepository && sharedGoalsRefreshPromise === request) {
        sharedGoalsRefreshPromise = null;
        sharedGoalsRefreshCurrency = null;
      }
      setIsLoading(false);
    }
  }, [appCurrency, isSharedRepository, repository]);

  const refresh = useCallback(async () => {
    await loadGoals(true);
  }, [loadGoals]);

  const create = useCallback(
    async (input: CreateGoalInput): Promise<GoalPlanItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        if (isSharedRepository) {
          sharedGoalsCache = [...(sharedGoalsCache ?? []), created];
          sharedGoalsCacheCurrency = appCurrency;
        }
        setItems((current) => [...current, created]);
        return created;
      } catch (createError) {
        setError(getErrorMessage(createError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [appCurrency, isSharedRepository, repository],
  );

  const update = useCallback(
    async (id: string, patch: UpdateGoalPatch): Promise<GoalPlanItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(id, patch);
        if (!updated) {
          return null;
        }

        if (isSharedRepository && sharedGoalsCache !== null) {
          sharedGoalsCache = sharedGoalsCache.map(
            (item) => (item.id === updated.id ? updated : item),
          );
          sharedGoalsCacheCurrency = appCurrency;
        }
        setItems((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        return updated;
      } catch (updateError) {
        setError(getErrorMessage(updateError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [appCurrency, isSharedRepository, repository],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const removed = await repository.remove(id);
        if (removed) {
          if (isSharedRepository && sharedGoalsCache !== null) {
            sharedGoalsCache = sharedGoalsCache.filter(
              (item) => item.id !== id,
            );
            sharedGoalsCacheCurrency = appCurrency;
          }
          setItems((current) => current.filter((item) => item.id !== id));
        }
        return removed;
      } catch (removeError) {
        setError(getErrorMessage(removeError));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [appCurrency, isSharedRepository, repository],
  );

  const resolveDeletion = useCallback(
    async (id: string, input: GoalDeleteResolutionInput): Promise<GoalDeleteResolutionResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await repository.resolveDeletion(id, input);
        if (result?.deleted) {
          if (isSharedRepository && sharedGoalsCache !== null) {
            sharedGoalsCache = sharedGoalsCache.filter((item) => item.id !== id);
            sharedGoalsCacheCurrency = appCurrency;
          }
          setItems((current) => current.filter((item) => item.id !== id));
        }
        return result;
      } catch (resolveError) {
        setError(getErrorMessage(resolveError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [appCurrency, isSharedRepository, repository],
  );

  const clearAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await repository.clearAll();
      if (isSharedRepository) {
        sharedGoalsCache = [];
        sharedGoalsCacheCurrency = appCurrency;
      }
      setItems([]);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsLoading(false);
    }
  }, [appCurrency, isSharedRepository, repository]);

  useEffect(() => {
    void loadGoals(false);
  }, [loadGoals]);

  return {
    items,
    isLoading,
    error,
    refresh,
    create,
    update,
    resolveDeletion,
    remove,
    clearAll,
  };
};
