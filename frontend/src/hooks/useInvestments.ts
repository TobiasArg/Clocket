import { useCallback, useEffect, useMemo, useState } from "react";
import { investmentsRepository } from "@/data/localStorage/investmentsRepository";
import type {
  CreateInvestmentInput,
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
        setPositions((current) => [...current, created]);
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

        setPositions((current) =>
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

  const deletePosition = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const removed = await repository.deletePosition(id);
        if (removed) {
          setPositions((current) => current.filter((item) => item.id !== id));
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
    addPosition,
    editPosition,
    deletePosition,
    clearAll,
  };
};
