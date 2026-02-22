import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";

const DEFAULT_MAX_DRAG_UP_DISTANCE = 220;
const DEFAULT_CLOSE_THRESHOLD_RATIO = 0.5;
const DEFAULT_CLOSE_ANIMATION_MS = 260;

export interface SlideUpSheetProps {
  isOpen?: boolean;
  title: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  onRequestClose?: () => void;
  onSubmit?: () => void;
  backdropAriaLabel?: string;
  handleAriaLabel?: string;
  maxDragUpDistance?: number;
  closeThresholdRatio?: number;
  closeAnimationMs?: number;
  rootClassName?: string;
  viewportClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  handleClassName?: string;
}

export function SlideUpSheet({
  isOpen = false,
  title,
  children,
  footer,
  onRequestClose,
  onSubmit,
  backdropAriaLabel = "Cerrar panel",
  handleAriaLabel = "Desliza hacia arriba para cerrar",
  maxDragUpDistance = DEFAULT_MAX_DRAG_UP_DISTANCE,
  closeThresholdRatio = DEFAULT_CLOSE_THRESHOLD_RATIO,
  closeAnimationMs = DEFAULT_CLOSE_ANIMATION_MS,
  rootClassName = "absolute inset-0 z-30",
  viewportClassName = "absolute inset-x-0 top-0 bottom-[30%] px-4 pt-3",
  panelClassName = "flex h-full flex-col overflow-hidden rounded-b-[28px] border border-[var(--surface-border)] bg-[var(--panel-bg)] shadow-[0_24px_48px_rgba(0,0,0,0.18)]",
  headerClassName = "border-b border-[var(--surface-border)] px-4 py-3",
  bodyClassName = "flex-1 overflow-y-auto px-4 py-3",
  footerClassName = "border-t border-[var(--surface-border)] px-4 py-3",
  handleClassName = "touch-none border-t border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 pb-1.5 pt-2 active:scale-100",
}: SlideUpSheetProps) {
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [isEntered, setIsEntered] = useState<boolean>(false);

  const gestureStartYRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<number>(0);
  const closeTimeoutRef = useRef<number | null>(null);
  const isClosingRef = useRef<boolean>(false);
  const onRequestCloseRef = useRef(onRequestClose);

  const supportsPointerEvents = typeof window !== "undefined" && "PointerEvent" in window;
  const closeThreshold = maxDragUpDistance * closeThresholdRatio;

  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current === null || typeof window === "undefined") {
      return;
    }

    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  const triggerClose = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    clearCloseTimeout();
    isClosingRef.current = true;
    setIsClosing(true);
    setIsDragging(false);
    gestureStartYRef.current = null;
    pointerIdRef.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);

    if (typeof window === "undefined") {
      onRequestCloseRef.current?.();
      return;
    }

    closeTimeoutRef.current = window.setTimeout(() => {
      const requestClose = onRequestCloseRef.current;
      if (requestClose) {
        requestClose();
      } else {
        isClosingRef.current = false;
        setIsClosing(false);
      }
    }, closeAnimationMs);
  }, [clearCloseTimeout, closeAnimationMs]);

  const startGesture = useCallback((clientY: number) => {
    if (isClosingRef.current) {
      return;
    }

    gestureStartYRef.current = clientY;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(true);
  }, []);

  const updateGesture = useCallback((clientY: number) => {
    if (gestureStartYRef.current === null || isClosingRef.current) {
      return;
    }

    const deltaY = clientY - gestureStartYRef.current;
    const nextOffset = deltaY < 0
      ? Math.max(deltaY, -maxDragUpDistance)
      : 0;

    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  }, [maxDragUpDistance]);

  const finishGesture = useCallback(() => {
    if (gestureStartYRef.current === null) {
      return;
    }

    const draggedDistance = Math.abs(Math.min(0, dragOffsetRef.current));
    setIsDragging(false);
    gestureStartYRef.current = null;
    pointerIdRef.current = null;

    if (draggedDistance >= closeThreshold) {
      triggerClose();
      return;
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
  }, [closeThreshold, triggerClose]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    startGesture(event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    updateGesture(event.clientY);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    finishGesture();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    finishGesture();
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLButtonElement>) => {
    if (event.touches.length !== 1) {
      return;
    }

    startGesture(event.touches[0].clientY);
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLButtonElement>) => {
    if (event.touches.length !== 1 || gestureStartYRef.current === null) {
      return;
    }

    updateGesture(event.touches[0].clientY);
    event.preventDefault();
  };

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    setDragOffset(0);
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setIsClosing(false);
    isClosingRef.current = false;
    setIsEntered(false);
    clearCloseTimeout();

    const frameId = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        triggerClose();
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
      gestureStartYRef.current = null;
      pointerIdRef.current = null;
      isClosingRef.current = false;
    };
  }, [clearCloseTimeout, isOpen, triggerClose]);

  if (!isOpen) {
    return null;
  }

  const panelOffset = dragOffset + (isEntered ? 0 : -24);
  const panelTransform = isClosing
    ? "translateY(calc(-100% - 48px))"
    : `translateY(${panelOffset}px)`;
  const panelOpacity = isClosing ? 0 : (isEntered ? 1 : 0);
  const backdropOpacity = isClosing ? 0 : (isEntered ? 1 : 0);

  const content = (
    <>
      <div className={headerClassName}>
        <span className="text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]">{title}</span>
      </div>

      <div className={bodyClassName}>{children}</div>

      {footer && (
        <div className={footerClassName}>
          {footer}
        </div>
      )}

      <button
        type="button"
        onPointerDown={supportsPointerEvents ? handlePointerDown : undefined}
        onPointerMove={supportsPointerEvents ? handlePointerMove : undefined}
        onPointerUp={supportsPointerEvents ? handlePointerUp : undefined}
        onPointerCancel={supportsPointerEvents ? handlePointerCancel : undefined}
        onTouchStart={!supportsPointerEvents ? handleTouchStart : undefined}
        onTouchMove={!supportsPointerEvents ? handleTouchMove : undefined}
        onTouchEnd={!supportsPointerEvents ? finishGesture : undefined}
        onTouchCancel={!supportsPointerEvents ? finishGesture : undefined}
        className={handleClassName}
        aria-label={handleAriaLabel}
      >
        <div className="flex items-center justify-center">
          <span
            className={`h-1.5 w-14 rounded-full bg-[#9CA3AF] ${isDragging ? "scale-x-105" : "scale-x-100"} transition-transform duration-150`}
          />
        </div>
      </button>
    </>
  );

  return (
    <div className={rootClassName}>
      <button
        type="button"
        onClick={triggerClose}
        className="absolute inset-0 bg-black/45"
        style={{
          opacity: backdropOpacity,
          transition: "opacity 220ms ease",
        }}
        aria-label={backdropAriaLabel}
      />

      <div className={viewportClassName}>
        {onSubmit ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
            className={panelClassName}
            style={{
              transform: panelTransform,
              opacity: panelOpacity,
              transition: isDragging
                ? "none"
                : "transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease",
              willChange: "transform, opacity",
            }}
          >
            {content}
          </form>
        ) : (
          <div
            className={panelClassName}
            style={{
              transform: panelTransform,
              opacity: panelOpacity,
              transition: isDragging
                ? "none"
                : "transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease",
              willChange: "transform, opacity",
            }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
