import { IconBadge } from "../IconBadge/IconBadge";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";

export interface OptionPickerItem {
  id: string;
  label: string;
  subtitle?: string;
  icon: string;
  iconBg: string;
  disabled?: boolean;
  meta?: string;
}

export interface OptionPickerSheetProps {
  backdropAriaLabel?: string;
  emptyLabel?: string;
  errorLabel?: string;
  errorMessage?: string | null;
  handleAriaLabel?: string;
  isLoading?: boolean;
  isOpen?: boolean;
  items?: OptionPickerItem[];
  loadingLabel?: string;
  onRequestClose?: () => void;
  onSelect?: (item: OptionPickerItem) => void;
  rootClassName?: string;
  selectedId?: string | null;
  title?: string;
}

export function OptionPickerSheet({
  backdropAriaLabel = "Cerrar selector",
  emptyLabel = "Sin resultados",
  errorLabel = "No pudimos cargar las opciones.",
  errorMessage = null,
  handleAriaLabel = "Desliza hacia arriba para cerrar",
  isLoading = false,
  isOpen = false,
  items = [],
  loadingLabel = "Cargando opciones...",
  onRequestClose,
  onSelect,
  rootClassName = "absolute inset-0 z-40",
  selectedId = null,
  title = "Seleccionar opción",
}: OptionPickerSheetProps) {
  return (
    <SlideUpSheet
      isOpen={isOpen}
      title={title}
      onRequestClose={onRequestClose}
      backdropAriaLabel={backdropAriaLabel}
      handleAriaLabel={handleAriaLabel}
      rootClassName={rootClassName}
    >
      <div className="flex flex-col">
        {isLoading && (
          <span className="px-1 py-2 text-sm font-medium text-[var(--text-secondary)]">{loadingLabel}</span>
        )}

        {!isLoading && errorMessage && (
          <span className="px-1 py-2 text-sm font-medium text-[var(--text-secondary)]">
            {errorLabel}
          </span>
        )}

        {!isLoading && !errorMessage && items.length === 0 && (
          <span className="px-1 py-2 text-sm font-medium text-[var(--text-secondary)]">{emptyLabel}</span>
        )}

        {!isLoading && !errorMessage && items.length > 0 && (
          <div className="flex flex-col">
            {items.map((item, index) => {
              const isSelected = selectedId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (!item.disabled) {
                      onSelect?.(item);
                    }
                  }}
                  disabled={item.disabled}
                  className={`flex items-center justify-between gap-2 px-1 py-2 text-left ${
                    index < items.length - 1 ? "border-b border-[var(--surface-border)]" : ""
                  } ${item.disabled ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <IconBadge
                      icon={item.icon}
                      bg={item.iconBg}
                      size="h-[34px] w-[34px]"
                      rounded="rounded-lg"
                    />
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                        {item.label}
                      </span>
                      {item.subtitle && (
                        <span className="block truncate text-xs font-medium text-[var(--text-secondary)]">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {item.meta && (
                      <span className="text-[11px] font-medium text-[var(--text-secondary)]">{item.meta}</span>
                    )}
                    {isSelected && (
                      <PhosphorIcon
                        name="check"
                        size="text-[16px]"
                        className="text-[var(--text-secondary)]"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </SlideUpSheet>
  );
}
