import { useCallback, useEffect, useMemo, useState } from "react";
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
    label: "Compra",
    icon: "arrow-down",
    iconBg: "bg-[#16A34A]",
  },
  {
    id: "egreso",
    label: "Venta",
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
  return value === "ingreso" ? "Compra" : "Venta";
};

const resolveAssetTypeLabel = (value: AssetType): string => {
  return value === "crypto" ? "Cripto" : "Acción";
};

type SaleInputMode = "usd" | "shares";

export interface InvestmentQuickAddWidgetProps {
  isOpen: boolean;
  isEditing: boolean;
  isLoading: boolean;
  isFormValid: boolean;
  showValidation: boolean;
  assetTypeInput: AssetType;
  entryTypeInput: EntryType;
  saleInputMode: SaleInputMode;
  saleSharesInput: string;
  selectedAccountId: string;
  sortedAccounts: Array<{ id: string; name: string }>;
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
  onSaleInputModeChange: (value: SaleInputMode) => void;
  onSaleSharesChange: (value: string) => void;
  onAccountChange: (value: string) => void;
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
  saleInputMode,
  saleSharesInput,
  selectedAccountId,
  sortedAccounts,
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
  onSaleInputModeChange,
  onSaleSharesChange,
  onAccountChange,
  onTickerChange,
  onUsdSpentChange,
  onBuyPriceChange,
  onCreatedAtChange,
}: InvestmentQuickAddWidgetProps) {
  const [isEntryTypePickerOpen, setIsEntryTypePickerOpen] = useState<boolean>(false);
  const [isAssetTypePickerOpen, setIsAssetTypePickerOpen] = useState<boolean>(false);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState<boolean>(false);
  const isPurchase = entryTypeInput === "ingreso";
  const isSaleByUsd = !isPurchase && saleInputMode === "usd";
  const priceLabel = isPurchase ? "Precio de entrada (USD)" : "Precio de salida (USD)";
  const quantityFormulaLabel = isPurchase || isSaleByUsd
    ? "Cantidad derivada: amount = USD / precio"
    : "Cantidad derivada: amount = acciones";
  const selectedAccountName = useMemo(() => {
    return sortedAccounts.find((account) => account.id === selectedAccountId)?.name ?? "Seleccionar cuenta";
  }, [selectedAccountId, sortedAccounts]);
  const accountPickerItems = useMemo<OptionPickerItem[]>(() => {
    return sortedAccounts.map((account) => ({
      id: account.id,
      label: account.name,
      icon: "wallet",
      iconBg: "bg-[var(--text-primary)]",
    }));
  }, [sortedAccounts]);

  const closePickers = useCallback(() => {
    setIsEntryTypePickerOpen(false);
    setIsAssetTypePickerOpen(false);
    setIsAccountPickerOpen(false);
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
        title={isEditing ? "Nuevo movimiento" : "Nueva operación"}
        onRequestClose={handleRequestClose}
        onSubmit={onSubmit}
        backdropAriaLabel="Cerrar formulario"
        handleAriaLabel="Desliza hacia arriba para cerrar"
        footer={(
          <ActionButton
            type="submit"
            icon={isEditing ? "check" : "plus"}
            label={isEditing ? "Guardar movimiento" : "Guardar operación"}
            iconColor="text-white"
            labelColor="text-white"
            bg={isFormValid && !isLoading ? "bg-[#2563EB]" : "bg-[#93C5FD]"}
            padding="px-4 py-3"
            className={isFormValid && !isLoading ? "" : "opacity-80"}
            disabled={!isFormValid || isLoading}
          />
        )}
      >
        <div className="grid grid-cols-1 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Tipo</span>
            <button
              type="button"
              onClick={() => {
                setIsAccountPickerOpen(false);
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
                setIsAccountPickerOpen(false);
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

          {isPurchase && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Cuenta</span>
              <button
                type="button"
                onClick={() => {
                  if (sortedAccounts.length === 0) {
                    return;
                  }
                  setIsEntryTypePickerOpen(false);
                  setIsAssetTypePickerOpen(false);
                  setIsAccountPickerOpen(true);
                }}
                disabled={isLoading || sortedAccounts.length === 0}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-60"
              >
                <span className="truncate">{selectedAccountName}</span>
                <PhosphorIcon name="caret-right" size="text-[16px]" className="text-[var(--text-secondary)]" />
              </button>
              {sortedAccounts.length === 0 && (
                <span className="text-[11px] font-medium text-[#B45309]">
                  Crea una cuenta en Más &gt; Cuentas para registrar compras.
                </span>
              )}
            </label>
          )}

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

          {!isPurchase && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Modo de venta</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSaleInputModeChange("usd")}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    saleInputMode === "usd"
                      ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                      : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
                  }`}
                >
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => onSaleInputModeChange("shares")}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    saleInputMode === "shares"
                      ? "bg-[var(--surface-border)] text-[var(--text-primary)]"
                      : "bg-[var(--panel-bg)] text-[var(--text-secondary)]"
                  }`}
                >
                  Acciones
                </button>
              </div>
            </div>
          )}

          {(isPurchase || isSaleByUsd) && (
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
          )}

          {!isPurchase && !isSaleByUsd && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Cantidad de acciones</span>
              <input
                type="number"
                min="0.00000001"
                step="0.00000001"
                value={saleSharesInput}
                onChange={(event) => onSaleSharesChange(event.target.value)}
                placeholder="0.01"
                className="rounded-xl border border-[var(--surface-border)] bg-[var(--panel-bg)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{priceLabel}</span>
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
            {quantityFormulaLabel}
          </span>
          <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Cantidad: {derivedAmountLabel}</div>
          {entryTypeInput === "egreso" && (
            <div className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
              Disponible para venta: {availableAmountLabel}
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

      <OptionPickerSheet
        isOpen={isAccountPickerOpen}
        title="Seleccionar cuenta"
        items={accountPickerItems}
        selectedId={selectedAccountId}
        onRequestClose={() => {
          setIsAccountPickerOpen(false);
        }}
        onSelect={(item) => {
          onAccountChange(item.id);
          setIsAccountPickerOpen(false);
        }}
      />
    </>
  );
}
