import { useCallback, useEffect, useState } from "react";
import {
  type AppPath,
  DEFAULT_PATH,
  isBudgetDetailPath,
  isGoalDetailPath,
  isStaticAppPath,
  normalizePath,
  resolvePathFromLocation,
} from "./routes";

export function useRouter() {
  const [currentPath, setCurrentPath] = useState<AppPath>(() =>
    resolvePathFromLocation(),
  );

  useEffect(() => {
    const handlePopState = () => setCurrentPath(resolvePathFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (
      isStaticAppPath(normalized) ||
      isGoalDetailPath(normalized) ||
      isBudgetDetailPath(normalized)
    ) {
      setCurrentPath(normalized);
      return;
    }
    window.history.replaceState(null, "", DEFAULT_PATH);
    setCurrentPath(DEFAULT_PATH);
  }, []);

  const navigateTo = useCallback((path: AppPath, replace = false): void => {
    const normalized = normalizePath(window.location.pathname);
    if (normalized === path) {
      setCurrentPath(path);
      return;
    }
    if (replace) {
      window.history.replaceState(null, "", path);
    } else {
      window.history.pushState(null, "", path);
    }
    setCurrentPath(path);
  }, []);

  return { currentPath, navigateTo };
}
