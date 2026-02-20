import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TRANSACTIONS_CHANGED_EVENT,
  transactionsRepository,
  type CreateTransactionInput,
  type TransactionItem,
  type TransactionsRepository,
  type UpdateTransactionPatch,
} from "@/utils";

export interface UseTransactionsOptions {
  repository?: TransactionsRepository;
}

export interface UseTransactionsResult {
  items: TransactionItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateTransactionInput) => Promise<TransactionItem | null>;
  update: (id: string, patch: UpdateTransactionPatch) => Promise<TransactionItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE =
  "We couldn’t complete that transaction action. Please try again.";

const dedupeTransactionsById = (items: TransactionItem[]): TransactionItem[] => {
  const seen = new Set<string>();
  const unique: TransactionItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    unique.push(item);
  }

  return unique;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useTransactions = (
  options: UseTransactionsOptions = {},
): UseTransactionsResult => {
  const repository = useMemo(
    () => options.repository ?? transactionsRepository,
    [options.repository],
  );

  const [items, setItems] = useState<TransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTransactions = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const nextItems = await repository.list();
      setItems(dedupeTransactionsById(nextItems));
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [repository]);

  const refresh = useCallback(async () => {
    await refreshTransactions(true);
  }, [refreshTransactions]);

  const create = useCallback(
    async (input: CreateTransactionInput): Promise<TransactionItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        setItems((current) => dedupeTransactionsById([...current, created]));
        return created;
      } catch (createError) {
        setError(getErrorMessage(createError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [repository],
  );

  const update = useCallback(
    async (
      id: string,
      patch: UpdateTransactionPatch,
    ): Promise<TransactionItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(id, patch);
        if (!updated) {
          return null;
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
    [repository],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const removed = await repository.remove(id);
        if (removed) {
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
    [repository],
  );

  const clearAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await repository.clearAll();
      setItems([]);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleTransactionsChanged = () => {
      void refreshTransactions(false);
    };

    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);

    return () => {
      window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
    };
  }, [refreshTransactions]);

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
