import { useCallback, useEffect, useMemo, useState } from "react";
import { investmentsRepository } from "@/data/localStorage/investmentsRepository";
import type {
  AddInvestmentEntryInput,
  AddInvestmentEntryResult,
  CreateInvestmentInput,
  InvestmentEntryItem,
  InvestmentPositionItem,
  InvestmentsRepository,
  UpdateInvestmentPatch,
} from "@/domain/investments/repository";

export interface UseInvestmentsOptions {
  repository?: InvestmentsRepository;
}

export interface UseInvestmentsResult {
  positions: InvestmentPositionItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addEntry: (input: AddInvestmentEntryInput) => Promise<AddInvestmentEntryResult | null>;
  listEntriesByPosition: (positionId: string) => Promise<InvestmentEntryItem[]>;
  deleteEntry: (entryId: string) => Promise<boolean>;
  addPosition: (input: CreateInvestmentInput) => Promise<InvestmentPositionItem | null>;
  editPosition: (
    id: string,
    patch: UpdateInvestmentPatch,
  ) => Promise<InvestmentPositionItem | null>;
  deletePosition: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}

const FALLBACK_ERROR_MESSAGE =
  "No pudimos completar esa acción de inversión. Intenta nuevamente.";

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

  const [positions, setPositions] = useState<InvestmentPositionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextItems = await repository.listPositions();
      setPositions(nextItems);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  const addPosition = useCallback(
    async (input: CreateInvestmentInput): Promise<InvestmentPositionItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const created = await repository.addPosition(input);
        await refresh();
        return created;
      } catch (createError) {
        setError(getErrorMessage(createError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh, repository],
  );

  const addEntry = useCallback(
    async (input: AddInvestmentEntryInput): Promise<AddInvestmentEntryResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await repository.addEntry(input);
        await refresh();
        return result;
      } catch (createError) {
        setError(getErrorMessage(createError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh, repository],
  );

  const listEntriesByPosition = useCallback(
    async (positionId: string): Promise<InvestmentEntryItem[]> => {
      try {
        return await repository.listEntriesByPosition(positionId);
      } catch (listError) {
        setError(getErrorMessage(listError));
        return [];
      }
    },
    [repository],
  );

  const deleteEntry = useCallback(
    async (entryId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const removed = await repository.deleteEntry(entryId);
        if (removed) {
          await refresh();
        }

        return removed;
      } catch (removeError) {
        setError(getErrorMessage(removeError));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh, repository],
  );

  const editPosition = useCallback(
    async (
      id: string,
      patch: UpdateInvestmentPatch,
    ): Promise<InvestmentPositionItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.editPosition(id, patch);
        if (!updated) {
          return null;
        }

        await refresh();
        return updated;
      } catch (updateError) {
        setError(getErrorMessage(updateError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh, repository],
  );

  const deletePosition = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const removed = await repository.deletePosition(id);
        if (removed) {
          await refresh();
        }
        return removed;
      } catch (removeError) {
        setError(getErrorMessage(removeError));
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh, repository],
  );

  const clearAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await repository.clearAll();
      setPositions([]);
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
    positions,
    isLoading,
    error,
    refresh,
    addEntry,
    listEntriesByPosition,
    deleteEntry,
    addPosition,
    editPosition,
    deletePosition,
    clearAll,
  };
};
