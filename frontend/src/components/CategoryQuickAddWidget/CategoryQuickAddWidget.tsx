import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ActionButton } from "../ActionButton/ActionButton";
import { CategoryColorPicker, type CategoryColorPickerOption } from "../CategoryColorPicker/CategoryColorPicker";
import { CategoryIconPicker } from "../CategoryIconPicker/CategoryIconPicker";
import { IconBadge } from "../IconBadge/IconBadge";

const MAX_DRAG_UP_DISTANCE = 220;
const CLOSE_GESTURE_THRESHOLD = MAX_DRAG_UP_DISTANCE * 0.5;
const CLOSE_ANIMATION_MS = 260;

export interface CategoryQuickAddWidgetProps {
  colorOptions?: CategoryColorPickerOption[];
  colorLabel?: string;
  colorErrorLabel?: string;
  iconOptions?: string[];
  iconLabel?: string;
  iconErrorLabel?: string;
  nameErrorLabel?: string;
  isCategoryNameValid?: boolean;
  isColorValid?: boolean;
  isFormValid?: boolean;
  isIconValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  nameInput?: string;
  nameLabel?: string;
  namePlaceholder?: string;
  onColorChange?: (value: string) => void;
  onIconChange?: (value: string) => void;
  onNameInputChange?: (value: string) => void;
  onRequestClose?: () => void;
  onSubmit?: () => void;
  selectedColorKey?: string;
  selectedIcon?: string;
  showValidation?: boolean;
  submitLabel?: string;
  title?: string;
}

export function CategoryQuickAddWidget({
  colorOptions = [],
  colorLabel = "Color",
  colorErrorLabel = "Selecciona un color.",
  iconOptions = [],
  iconLabel = "Ícono",
  iconErrorLabel = "Selecciona un ícono.",
  nameErrorLabel = "Agrega un nombre corto.",
  isCategoryNameValid = false,
  isColorValid = false,
  isFormValid = false,
  isIconValid = false,
  isLoading = false,
  isOpen = false,
  nameInput = "",
  nameLabel = "Nombre",
  namePlaceholder = "Ej. Salud",
  onColorChange,
  onIconChange,
  onNameInputChange,
  onRequestClose,
  onSubmit,
  selectedColorKey = "",
  selectedIcon = "",
  showValidation = false,
  submitLabel = "Guardar categoría",
  title = "Nueva categoría",
}: CategoryQuickAddWidgetProps) {
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

  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
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

    closeTimeoutRef.current = window.setTimeout(() => {
      const requestClose = onRequestCloseRef.current;
      if (requestClose) {
        requestClose();
      } else {
        isClosingRef.current = false;
        setIsClosing(false);
      }
    }, CLOSE_ANIMATION_MS);
  }, [clearCloseTimeout]);

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
      ? Math.max(deltaY, -MAX_DRAG_UP_DISTANCE)
      : 0;

    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  }, []);

  const finishGesture = useCallback(() => {
    if (gestureStartYRef.current === null) {
      return;
    }

    const draggedDistance = Math.abs(Math.min(0, dragOffsetRef.current));
    setIsDragging(false);
    gestureStartYRef.current = null;
    pointerIdRef.current = null;

    if (draggedDistance >= CLOSE_GESTURE_THRESHOLD) {
      triggerClose();
      return;
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
  }, [triggerClose]);

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

  const handleTouchEnd = () => {
    finishGesture();
  };

  const handleTouchCancel = () => {
    finishGesture();
  };

  useEffect(() => {
    if (!isOpen) {
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

  const previewName = nameInput.trim().length > 0 ? nameInput.trim() : "Vista previa";
  const previewIcon = selectedIcon.trim().length > 0 ? selectedIcon : "tag";
  const previewColorClass = colorOptions.find((option) => option.key === selectedColorKey)?.swatchClass
    ?? "bg-[#71717A]";
  const panelOffset = dragOffset + (isEntered ? 0 : -24);
  const panelTransform = isClosing
    ? "translateY(calc(-100% - 48px))"
    : `translateY(${panelOffset}px)`;
  const panelOpacity = isClosing ? 0 : (isEntered ? 1 : 0);
  const backdropOpacity = isClosing ? 0 : (isEntered ? 1 : 0);

  return (
    <div className="absolute inset-0 z-30">
      <button
        type="button"
        onClick={triggerClose}
        className="absolute inset-0 bg-black/45"
        style={{
          opacity: backdropOpacity,
          transition: "opacity 220ms ease",
        }}
        aria-label="Cerrar formulario de categoría"
      />

      <div className="absolute inset-x-0 top-0 bottom-[30%] px-4 pt-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.();
          }}
          className="flex h-full flex-col overflow-hidden rounded-b-[28px] border border-[var(--surface-border)] bg-[var(--panel-bg)] shadow-[0_24px_48px_rgba(0,0,0,0.18)]"
          style={{
            transform: panelTransform,
            opacity: panelOpacity,
            transition: isDragging
              ? "none"
              : "transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease",
            willChange: "transform, opacity",
          }}
        >
          <div className="border-b border-[var(--surface-border)] px-4 py-3">
            <span className="text-[11px] font-semibold tracking-[1px] text-[var(--text-secondary)]">{title}</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] p-3">
                <IconBadge
                  icon={previewIcon}
                  bg={previewColorClass}
                  size="h-[40px] w-[40px]"
                  rounded="rounded-xl"
                />
                <div className="min-w-0">
                  <span className="block truncate font-['Outfit'] text-sm font-semibold text-[var(--text-primary)]">{previewName}</span>
                  <span className="block text-xs font-medium text-[var(--text-secondary)]">Categoría</span>
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">{nameLabel}</span>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(event) => onNameInputChange?.(event.target.value)}
                  placeholder={namePlaceholder}
                  className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
                />
                {showValidation && !isCategoryNameValid && (
                  <span className="text-[11px] font-medium text-[var(--text-secondary)]">{nameErrorLabel}</span>
                )}
              </label>

              <CategoryIconPicker
                options={iconOptions}
                selectedIcon={selectedIcon}
                onChange={onIconChange}
                label={iconLabel}
                showValidation={showValidation}
                isValid={isIconValid}
                errorLabel={iconErrorLabel}
              />

              <CategoryColorPicker
                options={colorOptions}
                selectedColorKey={selectedColorKey}
                onChange={onColorChange}
                label={colorLabel}
                showValidation={showValidation}
                isValid={isColorValid}
                errorLabel={colorErrorLabel}
              />
            </div>
          </div>

          <div className="border-t border-[var(--surface-border)] px-4 py-3">
            <ActionButton
              type="submit"
              icon="plus"
              label={isLoading ? "Guardando..." : submitLabel}
              iconColor="text-[var(--text-primary)]"
              labelColor="text-[var(--text-primary)]"
              bg={isFormValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-muted)]"}
              padding="px-4 py-3"
              className={isFormValid && !isLoading ? "" : "opacity-70"}
              disabled={!isFormValid || isLoading}
            />
          </div>

          <button
            type="button"
            onPointerDown={supportsPointerEvents ? handlePointerDown : undefined}
            onPointerMove={supportsPointerEvents ? handlePointerMove : undefined}
            onPointerUp={supportsPointerEvents ? handlePointerUp : undefined}
            onPointerCancel={supportsPointerEvents ? handlePointerCancel : undefined}
            onTouchStart={!supportsPointerEvents ? handleTouchStart : undefined}
            onTouchMove={!supportsPointerEvents ? handleTouchMove : undefined}
            onTouchEnd={!supportsPointerEvents ? handleTouchEnd : undefined}
            onTouchCancel={!supportsPointerEvents ? handleTouchCancel : undefined}
            className="touch-none border-t border-[var(--surface-border)] bg-[var(--surface-muted)] px-4 pb-1.5 pt-2 active:scale-100"
            aria-label="Desliza hacia arriba para cerrar"
          >
            <div className="flex items-center justify-center">
              <span
                className={`h-1.5 w-14 rounded-full bg-[#9CA3AF] ${isDragging ? "scale-x-105" : "scale-x-100"} transition-transform duration-150`}
              />
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
