import { useCallback, useEffect, useMemo, useState } from "react";
import {
  accountsRepository,
  type AccountItem,
  type AccountsRepository,
  type CreateAccountInput,
  type UpdateAccountPatch,
} from "@/utils";

export interface UseAccountsOptions {
  repository?: AccountsRepository;
}

export interface UseAccountsResult {
  items: AccountItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateAccountInput) => Promise<AccountItem | null>;
  update: (id: string, patch: UpdateAccountPatch) => Promise<AccountItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE =
  "We couldn't complete that account action. Please try again.";

let sharedAccountsCache: AccountItem[] | null = null;
let sharedAccountsRefreshPromise: Promise<AccountItem[]> | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useAccounts = (
  options: UseAccountsOptions = {},
): UseAccountsResult => {
  const repository = useMemo(
    () => options.repository ?? accountsRepository,
    [options.repository],
  );
  const isSharedRepository = repository === accountsRepository;

  const [items, setItems] = useState<AccountItem[]>(() => (
    isSharedRepository && sharedAccountsCache !== null
      ? sharedAccountsCache
      : []
  ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async (force: boolean) => {
    if (
      isSharedRepository &&
      !force &&
      sharedAccountsCache !== null
    ) {
      setItems(sharedAccountsCache);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let request: Promise<AccountItem[]>;
    if (isSharedRepository) {
      if (!sharedAccountsRefreshPromise) {
        sharedAccountsRefreshPromise = repository.list();
      }
      request = sharedAccountsRefreshPromise;
    } else {
      request = repository.list();
    }

    try {
      const nextItems = await request;
      if (isSharedRepository) {
        sharedAccountsCache = nextItems;
      }
      setItems(nextItems);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (isSharedRepository && sharedAccountsRefreshPromise === request) {
        sharedAccountsRefreshPromise = null;
      }
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  const refresh = useCallback(async () => {
    await loadAccounts(true);
  }, [loadAccounts]);

  const create = useCallback(
    async (input: CreateAccountInput): Promise<AccountItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        if (isSharedRepository) {
          sharedAccountsCache = [...(sharedAccountsCache ?? []), created];
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
    async (
      id: string,
      patch: UpdateAccountPatch,
    ): Promise<AccountItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(id, patch);
        if (!updated) {
          return null;
        }

        if (isSharedRepository && sharedAccountsCache !== null) {
          sharedAccountsCache = sharedAccountsCache.map(
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
          if (isSharedRepository && sharedAccountsCache !== null) {
            sharedAccountsCache = sharedAccountsCache.filter(
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
        sharedAccountsCache = [];
      }
      setItems([]);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  useEffect(() => {
    void loadAccounts(false);
  }, [loadAccounts]);

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
