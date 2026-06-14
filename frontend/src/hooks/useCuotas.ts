import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cuotasRepository,
  type CreateCuotaInput,
  type CuotaPlanItem,
  type CuotasRepository,
  type MarkCuotaPaidResult,
  type ReconcileDueCuotasResult,
  type UpdateCuotaPatch,
} from "@/utils";

export interface UseCuotasOptions {
  repository?: CuotasRepository;
}

export interface UseCuotasResult {
  items: CuotaPlanItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateCuotaInput) => Promise<CuotaPlanItem | null>;
  update: (id: string, patch: UpdateCuotaPatch) => Promise<CuotaPlanItem | null>;
  markPaid: (id: string) => Promise<MarkCuotaPaidResult | null>;
  reconcileDue: () => Promise<ReconcileDueCuotasResult | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE = "We couldn't complete that installment action. Please try again.";

let sharedCuotasCache: CuotaPlanItem[] | null = null;
let sharedCuotasRefreshPromise: Promise<CuotaPlanItem[]> | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useCuotas = (options: UseCuotasOptions = {}): UseCuotasResult => {
  const repository = useMemo(
    () => options.repository ?? cuotasRepository,
    [options.repository],
  );
  const isSharedRepository = repository === cuotasRepository;

  const [items, setItems] = useState<CuotaPlanItem[]>(() => (
    isSharedRepository && sharedCuotasCache !== null
      ? sharedCuotasCache
      : []
  ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCuotas = useCallback(async (force: boolean) => {
    if (
      isSharedRepository &&
      !force &&
      sharedCuotasCache !== null
    ) {
      setItems(sharedCuotasCache);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let request: Promise<CuotaPlanItem[]>;
    if (isSharedRepository) {
      if (!sharedCuotasRefreshPromise) {
        sharedCuotasRefreshPromise = repository.list();
      }
      request = sharedCuotasRefreshPromise;
    } else {
      request = repository.list();
    }

    try {
      const nextItems = await request;
      if (isSharedRepository) {
        sharedCuotasCache = nextItems;
      }
      setItems(nextItems);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (isSharedRepository && sharedCuotasRefreshPromise === request) {
        sharedCuotasRefreshPromise = null;
      }
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  const refresh = useCallback(async () => {
    await loadCuotas(true);
  }, [loadCuotas]);

  const create = useCallback(
    async (input: CreateCuotaInput): Promise<CuotaPlanItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        if (isSharedRepository) {
          sharedCuotasCache = [...(sharedCuotasCache ?? []), created];
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
    async (id: string, patch: UpdateCuotaPatch): Promise<CuotaPlanItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(id, patch);
        if (!updated) {
          return null;
        }

        if (isSharedRepository && sharedCuotasCache !== null) {
          sharedCuotasCache = sharedCuotasCache.map(
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

  const markPaid = useCallback(
    async (id: string): Promise<MarkCuotaPaidResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await repository.markPaid(id);
        if (!result) {
          return null;
        }

        if (isSharedRepository && sharedCuotasCache !== null) {
          sharedCuotasCache = sharedCuotasCache.map(
            (item) => (item.id === result.plan.id ? result.plan : item),
          );
        }
        setItems((current) =>
          current.map((item) => (item.id === result.plan.id ? result.plan : item)),
        );
        return result;
      } catch (markPaidError) {
        setError(getErrorMessage(markPaidError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isSharedRepository, repository],
  );

  const reconcileDue = useCallback(
    async (): Promise<ReconcileDueCuotasResult | null> => {
      setError(null);

      try {
        const result = await repository.reconcileDue();
        if (result.results.length > 0) {
          const reconciledById = new Map(
            result.results.map((item) => [item.plan.id, item.plan]),
          );
          if (isSharedRepository && sharedCuotasCache !== null) {
            sharedCuotasCache = sharedCuotasCache.map((item) => reconciledById.get(item.id) ?? item);
          }
          setItems((current) => current.map((item) => reconciledById.get(item.id) ?? item));
        }
        return result;
      } catch (reconcileError) {
        setError(getErrorMessage(reconcileError));
        return null;
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
          if (isSharedRepository && sharedCuotasCache !== null) {
            sharedCuotasCache = sharedCuotasCache.filter(
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
        sharedCuotasCache = [];
      }
      setItems([]);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  useEffect(() => {
    void loadCuotas(false);
  }, [loadCuotas]);

  return {
    items,
    isLoading,
    error,
    refresh,
    create,
    update,
    markPaid,
    reconcileDue,
    remove,
    clearAll,
  };
};
