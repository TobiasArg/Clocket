import { useCallback, useEffect, useState } from "react";
import type { AssetType, EntryType } from "@/domain/investments/portfolioTypes";
import { ActionButton } from "../ActionButton/ActionButton";
import {
  OptionPickerSheet,
  type OptionPickerItem,
} from "../OptionPickerSheet/OptionPickerSheet";
import { PhosphorIcon } from "../PhosphorIcon/PhosphorIcon";
import { SlideUpSheet } from "../SlideUpSheet/SlideUpSheet";

const ENTRY_TYPE_OPTIONS: OptionPickerItem[] = [
  {
    id: "ingreso",
    label: "Ingreso",
    icon: "arrow-down",
    iconBg: "bg-[#16A34A]",
  },
  {
    id: "egreso",
    label: "Egreso",
    icon: "arrow-up",
    iconBg: "bg-[#DC2626]",
  },
];

const ASSET_TYPE_OPTIONS: OptionPickerItem[] = [
  {
    id: "stock",
    label: "Acción",
    icon: "chart-line-up",
    iconBg: "bg-[#2563EB]",
  },
  {
    id: "crypto",
    label: "Cripto",
    icon: "currency-dollar",
    iconBg: "bg-[#D97706]",
  },
];

const resolveEntryTypeLabel = (value: EntryType): string => {
  return value === "ingreso" ? "Ingreso" : "Egreso";
};

const resolveAssetTypeLabel = (value: AssetType): string => {
  return value === "crypto" ? "Cripto" : "Acción";
};

export interface InvestmentQuickAddWidgetProps {
  isOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isFormValid: boolean;
  showValidation: boolean;
  assetTypeInput: AssetType;
  entryTypeInput: EntryType;
  tickerInput: string;
  usdSpentInput: string;
  buyPriceInput: string;
  createdAtInput: string;
  availableAmountLabel: string;
  derivedAmountLabel: string;
  validationMessage: string | null;
  onClose: () => void;
  onSubmit: () => void;
  onAssetTypeChange: (value: AssetType) => void;
  onEntryTypeChange: (value: EntryType) => void;
  onTickerChange: (value: string) => void;
  onUsdSpentChange: (value: string) => void;
  onBuyPriceChange: (value: string) => void;
  onCreatedAtChange: (value: string) => void;
}

export function InvestmentQuickAddWidget({
  isOpen,
  isEditing,
  isLoading,
  isFormValid,
  showValidation,
  assetTypeInput,
  entryTypeInput,
  tickerInput,
  usdSpentInput,
  buyPriceInput,
  createdAtInput,
  availableAmountLabel,
  derivedAmountLabel,
  validationMessage,
  onClose,
  onSubmit,
  onAssetTypeChange,
  onEntryTypeChange,
  onTickerChange,
  onUsdSpentChange,
  onBuyPriceChange,
  onCreatedAtChange,
}: InvestmentQuickAddWidgetProps) {
  const [isEntryTypePickerOpen, setIsEntryTypePickerOpen] = useState<boolean>(false);
  const [isAssetTypePickerOpen, setIsAssetTypePickerOpen] = useState<boolean>(false);

  const closePickers = useCallback(() => {
    setIsEntryTypePickerOpen(false);
    setIsAssetTypePickerOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      closePickers();
    }
  }, [closePickers, isOpen]);

  const handleRequestClose = () => {
    closePickers();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <SlideUpSheet
        isOpen={isOpen}
        title={isEditing ? "Nuevo movimiento" : "Nueva entrada"}
        onRequestClose={handleRequestClose}
        onSubmit={onSubmit}
        backdropAriaLabel="Cerrar formulario"
        handleAriaLabel="Desliza hacia arriba para cerrar"
        footer={(
          <ActionButton
            type="submit"
            icon={isEditing ? "check" : "plus"}
            label={isEditing ? "Guardar movimiento" : "Guardar entrada"}
            iconColor="text-white"
            labelColor="text-white"
            bg={isFormValid && !isLoading ? "bg-[#2563EB]" : "bg-[#93C5FD]"}
            padding="px-4 py-3"
            className={isFormValid && !isLoading ? "" : "opacity-80"}
            disabled={!isFormValid || isLoading}
          />
        )}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Tipo</span>
            <button
              type="button"
              onClick={() => {
                setIsAssetTypePickerOpen(false);
                setIsEntryTypePickerOpen(true);
              }}
              disabled={isLoading}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-60"
            >
              <span className="truncate">{resolveEntryTypeLabel(entryTypeInput)}</span>
              <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
            </button>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Activo</span>
            <button
              type="button"
              onClick={() => {
                setIsEntryTypePickerOpen(false);
                setIsAssetTypePickerOpen(true);
              }}
              disabled={isLoading}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-60"
            >
              <span className="truncate">{resolveAssetTypeLabel(assetTypeInput)}</span>
              <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
            </button>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Ticker</span>
            <input
              type="text"
              value={tickerInput}
              onChange={(event) => onTickerChange(event.target.value.toUpperCase())}
              placeholder={assetTypeInput === "crypto" ? "BTC" : "AAPL"}
              className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">USD</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={usdSpentInput}
              onChange={(event) => onUsdSpentChange(event.target.value)}
              placeholder="1000"
              className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Precio de entrada (USD)</span>
            <input
              type="number"
              min="0.00000001"
              step="0.00000001"
              value={buyPriceInput}
              onChange={(event) => onBuyPriceChange(event.target.value)}
              className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Fecha</span>
            <input
              type="datetime-local"
              value={createdAtInput}
              onChange={(event) => onCreatedAtChange(event.target.value)}
              className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            />
          </label>
        </div>

        <div className="mt-3 rounded-xl bg-[var(--surface-muted)] px-3 py-2">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Cantidad derivada: <strong>amount = USD / precio</strong>
          </span>
          <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Cantidad: {derivedAmountLabel}</div>
          {entryTypeInput === "egreso" && (
            <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
              Disponible para egreso: {availableAmountLabel}
            </div>
          )}
        </div>

        {showValidation && validationMessage && (
          <span className="mt-3 block text-xs font-medium text-[#B45309]">
            {validationMessage}
          </span>
        )}
      </SlideUpSheet>

      <OptionPickerSheet
        isOpen={isEntryTypePickerOpen}
        title="Seleccionar tipo"
        items={ENTRY_TYPE_OPTIONS}
        selectedId={entryTypeInput}
        onRequestClose={() => {
          setIsEntryTypePickerOpen(false);
        }}
        onSelect={(item) => {
          if (item.id === "ingreso" || item.id === "egreso") {
            onEntryTypeChange(item.id);
            setIsEntryTypePickerOpen(false);
          }
        }}
      />

      <OptionPickerSheet
        isOpen={isAssetTypePickerOpen}
        title="Seleccionar activo"
        items={ASSET_TYPE_OPTIONS}
        selectedId={assetTypeInput}
        onRequestClose={() => {
          setIsAssetTypePickerOpen(false);
        }}
        onSelect={(item) => {
          if (item.id === "stock" || item.id === "crypto") {
            onAssetTypeChange(item.id);
            setIsAssetTypePickerOpen(false);
          }
        }}
      />
    </>
  );
}
