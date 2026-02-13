import { useCallback, useEffect, useMemo, useState } from "react";
import {
  investmentsRepository,
  type CreateInvestmentInput,
  type InvestmentPositionItem,
  type InvestmentsRepository,
  type UpdateInvestmentPatch,
} from "@/utils";

export interface UseInvestmentsOptions {
  repository?: InvestmentsRepository;
}

export interface UseInvestmentsResult {
  items: InvestmentPositionItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: CreateInvestmentInput) => Promise<InvestmentPositionItem | null>;
  update: (
    id: string,
    patch: UpdateInvestmentPatch,
  ) => Promise<InvestmentPositionItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE =
  "We couldn’t complete that investment action. Please try again.";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useInvestments = (
  options: UseInvestmentsOptions = {},
): UseInvestmentsResult => {
  const repository = useMemo(
    () => options.repository ?? investmentsRepository,
    [options.repository],
  );

  const [items, setItems] = useState<InvestmentPositionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextItems = await repository.list();
      setItems(nextItems);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  const create = useCallback(
    async (input: CreateInvestmentInput): Promise<InvestmentPositionItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.create(input);
        setItems((current) => [...current, created]);
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
      patch: UpdateInvestmentPatch,
    ): Promise<InvestmentPositionItem | null> => {
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
