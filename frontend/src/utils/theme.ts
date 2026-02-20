import type { AppSettings } from "@/types";

export const APP_SETTINGS_STORAGE_KEY = "clocket.settings";

export const resolveStoredTheme = (
  rawValue: string | null,
): AppSettings["theme"] => {
  if (!rawValue) {
    return "light";
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (typeof parsed !== "object" || parsed === null) {
      return "light";
    }

    const maybeState = parsed as {
      settings?: {
        theme?: string;
      };
    };

    return maybeState.settings?.theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const getStoredTheme = (
  storageKey: string = APP_SETTINGS_STORAGE_KEY,
): AppSettings["theme"] => {
  if (typeof window === "undefined") {
    return "light";
  }

  return resolveStoredTheme(window.localStorage.getItem(storageKey));
};

export const applyTheme = (theme: AppSettings["theme"]): void => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
};

export const initializeThemeFromStorage = (
  storageKey: string = APP_SETTINGS_STORAGE_KEY,
): AppSettings["theme"] => {
  const theme = getStoredTheme(storageKey);
  applyTheme(theme);
  return theme;
};
