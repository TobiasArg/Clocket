import { useCallback, useEffect, useMemo, useState } from "react";
import {
  budgetsRepository,
  type BudgetPlanItem,
  type BudgetsRepository,
  type CreateBudgetInput,
  type UpdateBudgetPatch,
} from "@/utils";

export interface UseBudgetsOptions {
  repository?: BudgetsRepository;
}

export interface UseBudgetsResult {
  items: BudgetPlanItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateBudgetInput) => Promise<BudgetPlanItem | null>;
  update: (id: string, patch: UpdateBudgetPatch) => Promise<BudgetPlanItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE =
  "We couldn't complete that budget action. Please try again.";

let sharedBudgetsCache: BudgetPlanItem[] | null = null;
let sharedBudgetsRefreshPromise: Promise<BudgetPlanItem[]> | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useBudgets = (options: UseBudgetsOptions = {}): UseBudgetsResult => {
  const repository = useMemo(
    () => options.repository ?? budgetsRepository,
    [options.repository],
  );
  const isSharedRepository = repository === budgetsRepository;

  const [items, setItems] = useState<BudgetPlanItem[]>(() => (
    isSharedRepository && sharedBudgetsCache !== null
      ? sharedBudgetsCache
      : []
  ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgets = useCallback(async (force: boolean) => {
    if (
      isSharedRepository &&
      !force &&
      sharedBudgetsCache !== null
    ) {
      setItems(sharedBudgetsCache);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let request: Promise<BudgetPlanItem[]>;
    if (isSharedRepository) {
      if (!sharedBudgetsRefreshPromise) {
        sharedBudgetsRefreshPromise = repository.list();
      }
      request = sharedBudgetsRefreshPromise;
    } else {
      request = repository.list();
    }

    try {
      const nextItems = await request;
      if (isSharedRepository) {
        sharedBudgetsCache = nextItems;
      }
      setItems(nextItems);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (isSharedRepository && sharedBudgetsRefreshPromise === request) {
        sharedBudgetsRefreshPromise = null;
      }
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  const refresh = useCallback(async () => {
    await loadBudgets(true);
  }, [loadBudgets]);

  const create = useCallback(
    async (input: CreateBudgetInput): Promise<BudgetPlanItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        if (isSharedRepository) {
          sharedBudgetsCache = [...(sharedBudgetsCache ?? []), created];
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
    [isSharedRepository, repository],
  );

  const update = useCallback(
    async (id: string, patch: UpdateBudgetPatch): Promise<BudgetPlanItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(id, patch);
        if (!updated) {
          return null;
        }

        if (isSharedRepository && sharedBudgetsCache !== null) {
          sharedBudgetsCache = sharedBudgetsCache.map(
            (item) => (item.id === updated.id ? updated : item),
          );
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
    [isSharedRepository, repository],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const removed = await repository.remove(id);
        if (removed) {
          if (isSharedRepository && sharedBudgetsCache !== null) {
            sharedBudgetsCache = sharedBudgetsCache.filter(
              (item) => item.id !== id,
            );
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
    [isSharedRepository, repository],
  );

  const clearAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await repository.clearAll();
      if (isSharedRepository) {
        sharedBudgetsCache = [];
      }
      setItems([]);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  useEffect(() => {
    void loadBudgets(false);
  }, [loadBudgets]);

  return {
    items,
    isLoading,
    error,
    refresh,
    create,
    update,
    remove,
    clearAll,
  };
};
