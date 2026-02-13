import { useCallback, useEffect, useMemo, useState } from "react";
import {
  appSettingsRepository,
  type AppSettingsItem,
  type AppSettingsRepository,
  type UpdateAppSettingsPatch,
} from "@/utils";

export interface UseAppSettingsOptions {
  repository?: AppSettingsRepository;
}

export interface UseAppSettingsResult {
  settings: AppSettingsItem | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (patch: UpdateAppSettingsPatch) => Promise<AppSettingsItem | null>;
  reset: () => Promise<AppSettingsItem | null>;
}

const FALLBACK_ERROR_MESSAGE =
  "We couldn’t complete that settings action. Please try again.";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
};

export const useAppSettings = (
  options: UseAppSettingsOptions = {},
): UseAppSettingsResult => {
  const repository = useMemo(
    () => options.repository ?? appSettingsRepository,
    [options.repository],
  );

  const [settings, setSettings] = useState<AppSettingsItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextSettings = await repository.get();
      setSettings(nextSettings);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  const update = useCallback(
    async (patch: UpdateAppSettingsPatch): Promise<AppSettingsItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(patch);
        setSettings(updated);
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

  const reset = useCallback(async (): Promise<AppSettingsItem | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const resetSettings = await repository.reset();
      setSettings(resetSettings);
      return resetSettings;
    } catch (resetError) {
      setError(getErrorMessage(resetError));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    settings,
    isLoading,
    error,
    refresh,
    update,
    reset,
  };
};
