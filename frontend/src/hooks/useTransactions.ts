import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrency } from "./useCurrency";
import {
  getUsdRate,
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
  "We couldn't complete that transaction action. Please try again.";

let sharedTransactionsCache: TransactionItem[] | null = null;
let sharedTransactionsRefreshPromise: Promise<TransactionItem[]> | null = null;

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

const parseSignedAmount = (value: unknown): number => {
  const normalized = String(value ?? "").replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSignedAmount = (value: number, currency: "ARS" | "USD"): string => {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const absolute = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = currency === "USD" ? "$" : "ARS ";
  return `${sign}${prefix}${absolute}`;
};

const convertAmountFromArs = (amountInArs: number, currency: "ARS" | "USD"): number => {
  if (!Number.isFinite(amountInArs)) {
    return 0;
  }

  if (currency === "USD") {
    const usdRate = getUsdRate();
    if (!Number.isFinite(usdRate) || usdRate <= 0) {
      return 0;
    }
    return amountInArs / usdRate;
  }

  return amountInArs;
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
  const { currency } = useCurrency();
  const repository = useMemo(
    () => options.repository ?? transactionsRepository,
    [options.repository],
  );
  const isSharedRepository = repository === transactionsRepository;

  const [rawItems, setRawItems] = useState<TransactionItem[]>(() => (
    isSharedRepository && sharedTransactionsCache !== null
      ? sharedTransactionsCache
      : []
  ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => {
    const unique = dedupeTransactionsById(rawItems);

    return unique.map((item) => {
      const rawAmount = parseSignedAmount(item.amount);
      const convertedAmount = convertAmountFromArs(rawAmount, currency);

      return {
        ...item,
        amount: formatSignedAmount(convertedAmount, currency),
      };
    });
  }, [currency, rawItems]);

  const refreshTransactions = useCallback(async (showLoading: boolean, force = false) => {
    if (
      isSharedRepository &&
      !force &&
      sharedTransactionsCache !== null
    ) {
      setRawItems(sharedTransactionsCache);
      setError(null);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }
    setError(null);

    let request: Promise<TransactionItem[]>;
    if (isSharedRepository) {
      if (!sharedTransactionsRefreshPromise) {
        sharedTransactionsRefreshPromise = repository.list();
      }
      request = sharedTransactionsRefreshPromise;
    } else {
      request = repository.list();
    }

    try {
      const nextItems = await request;
      const deduped = dedupeTransactionsById(nextItems);
      if (isSharedRepository) {
        sharedTransactionsCache = deduped;
      }
      setRawItems(deduped);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (isSharedRepository && sharedTransactionsRefreshPromise === request) {
        sharedTransactionsRefreshPromise = null;
      }
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [isSharedRepository, repository]);

  const refresh = useCallback(async () => {
    await refreshTransactions(true, true);
  }, [refreshTransactions]);

  const create = useCallback(
    async (input: CreateTransactionInput): Promise<TransactionItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        if (isSharedRepository) {
          sharedTransactionsCache = dedupeTransactionsById([
            ...(sharedTransactionsCache ?? []),
            created,
          ]);
        }
        setRawItems((current) => dedupeTransactionsById([...current, created]));
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
      patch: UpdateTransactionPatch,
    ): Promise<TransactionItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(id, patch);
        if (!updated) {
          return null;
        }

        if (isSharedRepository && sharedTransactionsCache !== null) {
          sharedTransactionsCache = sharedTransactionsCache.map(
            (item) => (item.id === updated.id ? updated : item),
          );
        }
        setRawItems((current) =>
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
          if (isSharedRepository && sharedTransactionsCache !== null) {
            sharedTransactionsCache = sharedTransactionsCache.filter(
              (item) => item.id !== id,
            );
          }
          setRawItems((current) => current.filter((item) => item.id !== id));
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
        sharedTransactionsCache = [];
      }
      setRawItems([]);
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setIsLoading(false);
    }
  }, [isSharedRepository, repository]);

  useEffect(() => {
    void refreshTransactions(true, false);
  }, [refreshTransactions]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleTransactionsChanged = () => {
      void refreshTransactions(false, false);
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
