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
const SETTINGS_UPDATED_EVENT = "clocket:app-settings-updated";
let sharedSettingsCache: AppSettingsItem | null = null;
let hasSharedSettingsCache = false;
let sharedSettingsRefreshPromise: Promise<AppSettingsItem> | null = null;

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
  const isSharedRepository = repository === appSettingsRepository;

  const [settings, setSettings] = useState<AppSettingsItem | null>(() => (
    isSharedRepository && hasSharedSettingsCache
      ? sharedSettingsCache
      : null
  ));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const broadcastSettingsUpdate = useCallback((next: AppSettingsItem) => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent<AppSettingsItem>(SETTINGS_UPDATED_EVENT, { detail: next }),
    );
  }, []);

  const writeSharedCache = useCallback((next: AppSettingsItem) => {
    sharedSettingsCache = next;
    hasSharedSettingsCache = true;
  }, []);

  const loadSettings = useCallback(async (force: boolean) => {
    if (
      isSharedRepository &&
      !force &&
      hasSharedSettingsCache &&
      sharedSettingsCache
    ) {
      setSettings(sharedSettingsCache);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let request: Promise<AppSettingsItem>;
    if (isSharedRepository) {
      if (!sharedSettingsRefreshPromise) {
        sharedSettingsRefreshPromise = repository.get();
      }
      request = sharedSettingsRefreshPromise;
    } else {
      request = repository.get();
    }

    try {
      const nextSettings = await request;
      if (isSharedRepository) {
        writeSharedCache(nextSettings);
      }
      setSettings(nextSettings);
    } catch (refreshError) {
      setError(getErrorMessage(refreshError));
    } finally {
      if (isSharedRepository && sharedSettingsRefreshPromise === request) {
        sharedSettingsRefreshPromise = null;
      }
      setIsLoading(false);
    }
  }, [isSharedRepository, repository, writeSharedCache]);

  const refresh = useCallback(async () => {
    await loadSettings(true);
  }, [loadSettings]);

  const update = useCallback(
    async (patch: UpdateAppSettingsPatch): Promise<AppSettingsItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const updated = await repository.update(patch);
        if (isSharedRepository) {
          writeSharedCache(updated);
        }
        setSettings(updated);
        broadcastSettingsUpdate(updated);
        return updated;
      } catch (updateError) {
        setError(getErrorMessage(updateError));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [broadcastSettingsUpdate, isSharedRepository, repository, writeSharedCache],
  );

  const reset = useCallback(async (): Promise<AppSettingsItem | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const resetSettings = await repository.reset();
      if (isSharedRepository) {
        writeSharedCache(resetSettings);
      }
      setSettings(resetSettings);
      broadcastSettingsUpdate(resetSettings);
      return resetSettings;
    } catch (resetError) {
      setError(getErrorMessage(resetError));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [broadcastSettingsUpdate, isSharedRepository, repository, writeSharedCache]);

  useEffect(() => {
    void loadSettings(false);
  }, [loadSettings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleSettingsUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<AppSettingsItem>;
      if (!customEvent.detail) {
        return;
      }

      writeSharedCache(customEvent.detail);
      setSettings(customEvent.detail);
      setError(null);
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdate);
    };
  }, [writeSharedCache]);

  return {
    settings,
    isLoading,
    error,
    refresh,
    update,
    reset,
  };
};
