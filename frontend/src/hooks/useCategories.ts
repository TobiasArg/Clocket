import { useCallback, useEffect, useMemo, useState } from "react";
import {
  categoriesRepository,
  type CategoriesRepository,
  type CategoryItem,
  type CreateCategoryInput,
  type UpdateCategoryPatch,
} from "@/utils";

export interface UseCategoriesOptions {
  repository?: CategoriesRepository;
}

export interface UseCategoriesResult {
  items: CategoryItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateCategoryInput) => Promise<CategoryItem | null>;
  update: (id: string, patch: UpdateCategoryPatch) => Promise<CategoryItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE =
  "We couldn't complete that category action. Please try again.";

let sharedCategoriesCache: CategoryItem[] | null = null;
let sharedCategoriesRefreshPromise: Promise<CategoryItem[]> | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useCategories = (
  options: UseCategoriesOptions = {},
): UseCategoriesResult => {
  const repository = useMemo(
    () => options.repository ?? categoriesRepository,
    [options.repository],
  );
  const isSharedRepository = repository === categoriesRepository;

  const [items, setItems] = useState<CategoryItem[]>(() => (
    isSharedRepository && sharedCategoriesCache !== null
      ? sharedCategoriesCache
      : []
  ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async (force: boolean) => {
    if (
      isSharedRepository &&
      !force &&
      sharedCategoriesCache !== null
    ) {
      setItems(sharedCategoriesCache);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let request: Promise<CategoryItem[]>;
    if (isSharedRepository) {
      if (!sharedCategoriesRefreshPromise) {
        sharedCategoriesRefreshPromise = repository.list();
      }
      request = sharedCategoriesRefreshPromise;
    } else {
      request = repository.list();
    }

    try {
      const nextItems = await request;
      if (isSharedRepository) {
        sharedCategoriesCache = nextItems;
      }
      setItems(nextItems);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (isSharedRepository && sharedCategoriesRefreshPromise === request) {
        sharedCategoriesRefreshPromise = null;
      }
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  const refresh = useCallback(async () => {
    await loadCategories(true);
  }, [loadCategories]);

  const create = useCallback(
    async (input: CreateCategoryInput): Promise<CategoryItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        if (isSharedRepository) {
          sharedCategoriesCache = [...(sharedCategoriesCache ?? []), created];
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
    async (id: string, patch: UpdateCategoryPatch): Promise<CategoryItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(id, patch);
        if (!updated) {
          return null;
        }

        if (isSharedRepository && sharedCategoriesCache !== null) {
          sharedCategoriesCache = sharedCategoriesCache.map(
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
          if (isSharedRepository && sharedCategoriesCache !== null) {
            sharedCategoriesCache = sharedCategoriesCache.filter(
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
        sharedCategoriesCache = [];
      }
      setItems([]);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  useEffect(() => {
    void loadCategories(false);
  }, [loadCategories]);

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
