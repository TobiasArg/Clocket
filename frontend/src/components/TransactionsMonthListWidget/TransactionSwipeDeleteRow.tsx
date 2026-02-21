import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { IconBadge } from "../IconBadge/IconBadge";
import { ListItemRow } from "../ListItemRow/ListItemRow";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";
import type { TransactionItem } from "@/utils";

export interface TransactionSwipeDeleteRowProps {
  deleteActionLabel: string;
  editActionLabel: string;
  isDeleting: boolean;
  isInteractionLocked: boolean;
  onDelete?: (transactionId: string) => void;
  onSelect?: () => void;
  showBorder: boolean;
  subtitle: string;
  transaction: TransactionItem;
}

const MAX_REVEAL_PX = 96;
const SWIPE_TRIGGER_PX = 72;
const AXIS_LOCK_RATIO = 1.2;
const SWIPE_MIN_DISTANCE_PX = 6;
const RESET_TRANSITION_MS = 200;

type AxisLock = "horizontal" | "vertical" | null;

interface DragState {
  axisLock: AxisLock;
  isDragging: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  translateX: number;
}

const parseAmountSign = (value: string): "+" | "-" => {
  return value.trim().startsWith("+") ? "+" : "-";
};

const clampTranslateX = (value: number): number => {
  if (value > 0) {
    return 0;
  }

  if (value < -MAX_REVEAL_PX) {
    return -MAX_REVEAL_PX;
  }

  return value;
};

const createInitialDragState = (): DragState => ({
  axisLock: null,
  isDragging: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  translateX: 0,
});

export function TransactionSwipeDeleteRow({
  deleteActionLabel,
  editActionLabel,
  isDeleting,
  isInteractionLocked,
  onDelete,
  onSelect,
  showBorder,
  subtitle,
  transaction,
}: TransactionSwipeDeleteRowProps) {
  const swipeLayerRef = useRef<HTMLDivElement | null>(null);
  const revealViewportRef = useRef<HTMLDivElement | null>(null);
  const deleteIconRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>(createInitialDragState());
  const shouldSuppressClickRef = useRef<boolean>(false);

  const applySwipeProgress = (value: number): void => {
    const progress = Math.min(1, Math.abs(value) / MAX_REVEAL_PX);
    const revealViewportNode = revealViewportRef.current;
    const iconNode = deleteIconRef.current;
    const revealWidthPx = Math.max(0, Math.abs(value));

    if (revealViewportNode) {
      revealViewportNode.style.width = `${revealWidthPx}px`;
    }

    if (iconNode) {
      iconNode.style.opacity = `${0.5 + progress * 0.5}`;
      iconNode.style.transform = `scale(${0.92 + progress * 0.12})`;
    }
  };

  const applyTranslate = (value: number, withTransition: boolean): void => {
    const node = swipeLayerRef.current;
    if (!node) {
      return;
    }

    node.style.transition = withTransition
      ? `transform ${RESET_TRANSITION_MS}ms ease-out`
      : "none";
    node.style.transform = `translate3d(${value}px, 0, 0)`;
    dragStateRef.current.translateX = value;
    applySwipeProgress(value);
  };

  const resetSwipePosition = (withTransition: boolean): void => {
    applyTranslate(0, withTransition);
  };

  const clearDragState = (): void => {
    dragStateRef.current = createInitialDragState();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (isDeleting || isInteractionLocked) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    shouldSuppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      axisLock: null,
      isDragging: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      translateX: 0,
    };
    applyTranslate(0, false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const state = dragStateRef.current;
    if (!state.isDragging || state.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (state.axisLock === null) {
      if (absX < SWIPE_MIN_DISTANCE_PX && absY < SWIPE_MIN_DISTANCE_PX) {
        return;
      }

      if (absX > absY * AXIS_LOCK_RATIO) {
        state.axisLock = "horizontal";
      } else if (absY > absX * AXIS_LOCK_RATIO) {
        state.axisLock = "vertical";
      } else {
        return;
      }
    }

    if (state.axisLock !== "horizontal") {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    shouldSuppressClickRef.current = true;
    const nextTranslate = clampTranslateX(deltaX);
    applyTranslate(nextTranslate, false);
  };

  const finishPointerInteraction = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled: boolean,
  ): void => {
    const state = dragStateRef.current;
    if (!state.isDragging || state.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const shouldTriggerDelete = !cancelled &&
      state.axisLock === "horizontal" &&
      Math.abs(state.translateX) >= SWIPE_TRIGGER_PX;

    clearDragState();
    resetSwipePosition(true);

    if (shouldTriggerDelete) {
      onDelete?.(transaction.id);
      return;
    }

    if (!cancelled) {
      window.setTimeout(() => {
        shouldSuppressClickRef.current = false;
      }, RESET_TRANSITION_MS);
    }
  };

  const handleRowClick = (): void => {
    if (isDeleting || isInteractionLocked) {
      return;
    }

    if (shouldSuppressClickRef.current) {
      shouldSuppressClickRef.current = false;
      return;
    }

    onSelect?.();
  };

  useEffect(() => {
    resetSwipePosition(false);
    clearDragState();
    shouldSuppressClickRef.current = false;
  }, [isDeleting, isInteractionLocked, transaction.id]);

  useEffect(() => {
    applySwipeProgress(0);
  }, []);

  return (
    <div className="relative overflow-hidden touch-pan-y">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#DC2626]">
        <div
          ref={revealViewportRef}
          className="absolute inset-y-0 right-0 flex items-center justify-center overflow-hidden"
          style={{ width: 0 }}
        >
          <div
            ref={deleteIconRef}
            className="text-white opacity-50 transition-transform duration-200"
          >
            <PhosphorIcon name="trash-simple" size="text-[20px]" />
          </div>
        </div>
      </div>

      <div
        ref={swipeLayerRef}
        className="relative z-10 w-full bg-[var(--panel-bg)] will-change-transform select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => {
          finishPointerInteraction(event, false);
        }}
        onPointerCancel={(event) => {
          finishPointerInteraction(event, true);
        }}
        onLostPointerCapture={() => {
          resetSwipePosition(true);
          clearDragState();
          shouldSuppressClickRef.current = false;
        }}
      >
        <ListItemRow
          left={<IconBadge icon={transaction.icon} bg={transaction.iconBg} />}
          title={transaction.name}
          subtitle={subtitle}
          titleClassName="text-[15px] font-semibold text-[var(--text-primary)] font-['Outfit']"
          subtitleClassName="text-[11px] font-medium text-[var(--text-secondary)] truncate"
          right={(
            <div className="flex flex-col gap-0.5 items-end shrink-0">
              <span
                className={`text-[15px] font-bold font-['Outfit'] ${
                  parseAmountSign(transaction.amount) === "+"
                    ? "text-[#16A34A]"
                    : "text-[#DC2626]"
                }`}
              >
                {transaction.amount}
              </span>
              <span className="block max-w-[132px] truncate text-[10px] font-medium text-[#A1A1AA]">
                {transaction.meta}
              </span>
              {isDeleting ? (
                <span className="text-[10px] font-semibold text-[#A1A1AA]">
                  {`${deleteActionLabel}...`}
                </span>
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)]">
                  <PhosphorIcon
                    name="pencil-simple"
                    size="text-[10px]"
                    className="text-[var(--text-secondary)]"
                  />
                  <span>{editActionLabel}</span>
                </div>
              )}
            </div>
          )}
          onClick={handleRowClick}
          showBorder={showBorder}
          className="w-full"
          padding="py-3.5"
        />
      </div>
    </div>
  );
}
