/**
 * Navigates to a path using the History API and fires a popstate event
 * so the app router picks up the change.
 */
export const navigateToPath = (to: string): void => {
  if (typeof window === "undefined") return;
  if (window.location.pathname === to) return;
  window.history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
};
