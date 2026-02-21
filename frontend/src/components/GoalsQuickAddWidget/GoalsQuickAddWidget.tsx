import { PhosphorIcon } from "@/components";
import { ActionButton } from "../ActionButton/ActionButton";

export interface GoalColorPickerOption {
  key: string;
  label: string;
  swatchClass: string;
}

export interface GoalsQuickAddWidgetProps {
  colorOptions?: GoalColorPickerOption[];
  deadlineDateInput?: string;
  descriptionInput?: string;
  iconOptions?: string[];
  isDeadlineValid?: boolean;
  isDescriptionValid?: boolean;
  isFormValid?: boolean;
  isIconValid?: boolean;
  isLoading?: boolean;
  isOpen?: boolean;
  isTargetValid?: boolean;
  isTitleValid?: boolean;
  onColorKeyChange?: (value: string) => void;
  onDeadlineDateChange?: (value: string) => void;
  onDescriptionChange?: (value: string) => void;
  onIconChange?: (value: string) => void;
  onSubmit?: () => void;
  onTargetAmountChange?: (value: string) => void;
  onTitleChange?: (value: string) => void;
  quickAddColorLabel?: string;
  quickAddDeadlineErrorLabel?: string;
  quickAddDeadlineLabel?: string;
  quickAddDescriptionErrorLabel?: string;
  quickAddDescriptionLabel?: string;
  quickAddIconLabel?: string;
  quickAddNameErrorLabel?: string;
  quickAddNameLabel?: string;
  quickAddSubmitLabel?: string;
  quickAddTargetAmountLabel?: string;
  quickAddTargetErrorLabel?: string;
  selectedColorKey?: string;
  selectedIcon?: string;
  showValidation?: boolean;
  targetAmountInput?: string;
  title?: string;
  titleInput?: string;
}

export function GoalsQuickAddWidget({
  colorOptions = [],
  deadlineDateInput = "",
  descriptionInput = "",
  iconOptions = [],
  isDeadlineValid = false,
  isDescriptionValid = false,
  isFormValid = false,
  isIconValid = false,
  isLoading = false,
  isOpen = false,
  isTargetValid = false,
  isTitleValid = false,
  onColorKeyChange,
  onDeadlineDateChange,
  onDescriptionChange,
  onIconChange,
  onSubmit,
  onTargetAmountChange,
  onTitleChange,
  quickAddColorLabel = "Color",
  quickAddDeadlineErrorLabel = "Selecciona una fecha límite válida.",
  quickAddDeadlineLabel = "Fecha límite",
  quickAddDescriptionErrorLabel = "Agrega una descripción breve.",
  quickAddDescriptionLabel = "Descripción",
  quickAddIconLabel = "Ícono",
  quickAddNameErrorLabel = "Agrega un nombre corto.",
  quickAddNameLabel = "Nombre",
  quickAddSubmitLabel = "Guardar meta",
  quickAddTargetAmountLabel = "Meta",
  quickAddTargetErrorLabel = "La meta debe ser mayor a 0.",
  selectedColorKey = "",
  selectedIcon = "",
  showValidation = false,
  targetAmountInput = "",
  title = "Nueva meta",
  titleInput = "",
}: GoalsQuickAddWidgetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="px-5 pb-2">
      <div className="flex flex-col gap-3 bg-[var(--surface-muted)] rounded-2xl p-4">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1px]">
          {title}
        </span>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddNameLabel}</span>
          <input
            type="text"
            value={titleInput}
            onChange={(event) => onTitleChange?.(event.target.value)}
            placeholder="Ej. Fondo Emergencia"
            className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
          />
          {showValidation && !isTitleValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{quickAddNameErrorLabel}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddDescriptionLabel}</span>
          <textarea
            value={descriptionInput}
            onChange={(event) => onDescriptionChange?.(event.target.value)}
            placeholder="¿Para qué estás ahorrando?"
            rows={2}
            className="w-full resize-none bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
          />
          {showValidation && !isDescriptionValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {quickAddDescriptionErrorLabel}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddTargetAmountLabel}</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmountInput}
            onChange={(event) => onTargetAmountChange?.(event.target.value)}
            placeholder="0.00"
            className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
          />
          {showValidation && !isTargetValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{quickAddTargetErrorLabel}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddDeadlineLabel}</span>
          <input
            type="date"
            value={deadlineDateInput}
            onChange={(event) => onDeadlineDateChange?.(event.target.value)}
            className="w-full bg-[var(--panel-bg)] rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[var(--surface-border)]"
          />
          {showValidation && !isDeadlineValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{quickAddDeadlineErrorLabel}</span>
          )}
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddIconLabel}</span>
          <div className="grid grid-cols-5 gap-2 rounded-xl bg-[var(--panel-bg)] p-2">
            {iconOptions.map((iconName) => {
              const isSelected = selectedIcon === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => onIconChange?.(iconName)}
                  className={`flex h-10 w-full items-center justify-center rounded-lg border ${
                    isSelected ? "border-black bg-[var(--surface-muted)]" : "border-[var(--surface-border)]"
                  }`}
                >
                  <PhosphorIcon name={iconName} size="text-[18px]" className="text-[var(--text-primary)]" />
                </button>
              );
            })}
          </div>
          {showValidation && !isIconValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              Selecciona un ícono.
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddColorLabel}</span>
          <div className="grid grid-cols-8 gap-2 rounded-xl bg-[var(--panel-bg)] p-2">
            {colorOptions.map((color) => {
              const isSelected = selectedColorKey === color.key;
              return (
                <button
                  key={color.key}
                  type="button"
                  title={color.label}
                  onClick={() => onColorKeyChange?.(color.key)}
                  className={`h-7 w-7 rounded-full border-2 ${color.swatchClass} ${
                    isSelected ? "border-black" : "border-white"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <ActionButton
          icon="plus"
          label={quickAddSubmitLabel}
          iconColor="text-[var(--text-primary)]"
          labelColor="text-[var(--text-primary)]"
          bg={isFormValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-muted)]"}
          padding="px-4 py-3"
          className={isFormValid && !isLoading ? "" : "opacity-70 pointer-events-none"}
          onClick={onSubmit}
        />
      </div>
    </div>
  );
}
