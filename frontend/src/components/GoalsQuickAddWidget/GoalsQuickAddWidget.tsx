import { ActionButton } from "../ActionButton/ActionButton";
import { CategoryColorPicker } from "../CategoryColorPicker/CategoryColorPicker";
import { CategoryIconPicker } from "../CategoryIconPicker/CategoryIconPicker";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";
import type { TransactionInputCurrency } from "@/utils";

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
  onRequestClose?: () => void;
  onSubmit?: () => void;
  onTargetAmountChange?: (value: string) => void;
  onTitleChange?: (value: string) => void;
  onCurrencyChange?: (value: TransactionInputCurrency) => void;
  quickAddColorLabel?: string;
  quickAddCurrencyLabel?: string;
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
  selectedCurrency?: TransactionInputCurrency;
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
  onCurrencyChange,
  onDeadlineDateChange,
  onDescriptionChange,
  onIconChange,
  onRequestClose,
  onSubmit,
  onTargetAmountChange,
  onTitleChange,
  quickAddColorLabel = "Color",
  quickAddCurrencyLabel = "Moneda",
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
  selectedCurrency = "ARS",
  selectedIcon = "",
  showValidation = false,
  targetAmountInput = "",
  title = "Nueva meta",
  titleInput = "",
}: GoalsQuickAddWidgetProps) {
  return (
    <SlideUpSheet
      isOpen={isOpen}
      title={title}
      onRequestClose={onRequestClose}
      onSubmit={onSubmit}
      backdropAriaLabel="Cerrar formulario de meta"
      handleAriaLabel="Desliza hacia arriba para cerrar"
      footer={(
        <ActionButton
          type="submit"
          icon="plus"
          label={isLoading ? "Guardando..." : quickAddSubmitLabel}
          iconColor="text-[var(--text-primary)]"
          labelColor="text-[var(--text-primary)]"
          bg={isFormValid && !isLoading ? "bg-[var(--surface-border)]" : "bg-[var(--surface-muted)]"}
          padding="px-4 py-3"
          className={isFormValid && !isLoading ? "" : "opacity-70"}
          disabled={!isFormValid || isLoading}
        />
      )}
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddNameLabel}</span>
          <input
            type="text"
            value={titleInput}
            onChange={(event) => onTitleChange?.(event.target.value)}
            placeholder="Ej. Fondo Emergencia"
            className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
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
            className="w-full resize-none rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:border-[#A1A1AA]"
          />
          {showValidation && !isDescriptionValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {quickAddDescriptionErrorLabel}
            </span>
          )}
        </label>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddTargetAmountLabel}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={targetAmountInput}
              onChange={(event) => onTargetAmountChange?.(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#A1A1AA]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddCurrencyLabel}</span>
            <select
              value={selectedCurrency}
              onChange={(event) => onCurrencyChange?.(event.target.value as TransactionInputCurrency)}
              className="min-w-[88px] rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#A1A1AA]"
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        {showValidation && !isTargetValid && (
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{quickAddTargetErrorLabel}</span>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">{quickAddDeadlineLabel}</span>
          <input
            type="date"
            value={deadlineDateInput}
            onChange={(event) => onDeadlineDateChange?.(event.target.value)}
            className="w-full rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[#A1A1AA]"
          />
          {showValidation && !isDeadlineValid && (
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">{quickAddDeadlineErrorLabel}</span>
          )}
        </label>

        <CategoryIconPicker
          options={iconOptions}
          selectedIcon={selectedIcon}
          onChange={onIconChange}
          label={quickAddIconLabel}
          showValidation={showValidation}
          isValid={isIconValid}
          errorLabel="Selecciona un ícono."
        />

        <CategoryColorPicker
          options={colorOptions}
          selectedColorKey={selectedColorKey}
          onChange={onColorKeyChange}
          label={quickAddColorLabel}
          showValidation={showValidation}
          isValid={true}
        />
      </div>
    </SlideUpSheet>
  );
}
