import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PhosphorIcon } from "@/components/PhosphorIcon/PhosphorIcon";

const CLOSE_ANIMATION_MS = 240;
const SWIPE_CLOSE_THRESHOLD = 88;
const SWIPE_MAX_DISTANCE = 220;
const SWIPE_DAMPING = 0.84;

export interface TransactionEditorSlideUpMenuProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const TransactionEditorSlideUpMenu = memo(function TransactionEditorSlideUpMenu({
  children,
  isOpen,
  onClose,
  title = "Menu",
}: TransactionEditorSlideUpMenuProps) {
  const closeTimeoutRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isEntered, setIsEntered] = useState<boolean>(false);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const requestClose = useCallback(() => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, CLOSE_ANIMATION_MS);
  }, [clearCloseTimeout, isClosing, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      setIsEntered(false);
      setSwipeOffset(0);
      touchStartYRef.current = null;
      clearCloseTimeout();
      return;
    }

    setIsClosing(false);
    setSwipeOffset(0);
    touchStartYRef.current = null;
    clearCloseTimeout();

    const frameId = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearCloseTimeout();
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [clearCloseTimeout, isOpen, requestClose]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  if (!isOpen) {
    return null;
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1 || isClosing) {
      return;
    }
    touchStartYRef.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = touchStartYRef.current;
    if (startY === null || isClosing) {
      return;
    }

    const deltaY = event.touches[0].clientY - startY;
    if (deltaY <= 0) {
      setSwipeOffset(0);
      return;
    }

    event.preventDefault();
    setSwipeOffset(Math.min(SWIPE_MAX_DISTANCE, deltaY * SWIPE_DAMPING));
  };

  const handleTouchEnd = () => {
    if (swipeOffset >= SWIPE_CLOSE_THRESHOLD) {
      requestClose();
      return;
    }

    touchStartYRef.current = null;
    setSwipeOffset(0);
  };

  const handleTouchCancel = () => {
    touchStartYRef.current = null;
    setSwipeOffset(0);
  };

  const panelOffset = swipeOffset + (isClosing ? SWIPE_MAX_DISTANCE + 64 : 0);
  const panelTransform = isEntered
    ? `translateY(${panelOffset}px)`
    : "translateY(40px)";
  const panelOpacity = isClosing ? 0 : (isEntered ? 1 : 0);
  const backdropOpacity = isClosing ? 0 : (isEntered ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={requestClose}
        className="absolute inset-0 bg-black/35"
        aria-label="Cerrar menu"
        style={{
          opacity: backdropOpacity,
          transition: "opacity 220ms ease",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-end md:justify-center md:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className="relative max-h-[88dvh] w-full overflow-hidden rounded-t-3xl border border-[var(--surface-border)] bg-[var(--panel-bg)] shadow-[0_-10px_36px_rgba(0,0,0,0.2)] md:max-w-xl md:rounded-3xl"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          style={{
            transform: panelTransform,
            opacity: panelOpacity,
            transition: "transform 260ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease",
          }}
        >
          <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-4 pb-3 pt-3">
            <div className="min-w-0">
              <span className="block text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]">
                {title}
              </span>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
              aria-label="Cerrar"
            >
              <PhosphorIcon name="x" size="text-[15px]" className="text-[var(--text-secondary)]" />
            </button>
          </div>

          <div className="max-h-[calc(88dvh-58px)] overflow-y-auto p-4">
            {children}
          </div>

          <div className="border-t border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 pb-2 pt-2">
            <div className="mx-auto h-1.5 w-14 rounded-full bg-[#9CA3AF]" />
          </div>
        </div>
      </div>
    </div>
  );
});
