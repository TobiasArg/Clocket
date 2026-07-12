import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface UseDialogFocusLifecycleOptions<T extends HTMLElement> {
  containerRef: RefObject<T>;
  initialFocusRef?: RefObject<HTMLElement>;
  isDismissDisabled?: boolean;
  isOpen: boolean;
  onDismiss?: () => void;
  restoreFocus?: boolean;
}

const focusDialogTarget = <T extends HTMLElement>(
  container: T,
  initialFocusElement?: HTMLElement | null,
): void => {
  const target = initialFocusElement
    ?? container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    ?? container;

  target.focus({ preventScroll: true });
};

export const useDialogFocusLifecycle = <T extends HTMLElement>({
  containerRef,
  initialFocusRef,
  isDismissDisabled = false,
  isOpen,
  onDismiss,
  restoreFocus = true,
}: UseDialogFocusLifecycleOptions<T>): void => {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined" || typeof window === "undefined") {
      return;
    }

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const frameId = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      focusDialogTarget(container, initialFocusRef?.current ?? null);
    });

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape" || isDismissDisabled) {
        return;
      }

      event.preventDefault();
      onDismiss?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);

      if (!restoreFocus || !previouslyFocusedElement?.isConnected) {
        return;
      }

      previouslyFocusedElement.focus({ preventScroll: true });
    };
  }, [containerRef, initialFocusRef, isDismissDisabled, isOpen, onDismiss, restoreFocus]);
};
