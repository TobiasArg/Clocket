import { DEFAULT_NAV_ITEMS } from "@/constants";
import type { NavItem } from "@/modules/investments";
import {
  BottomNavigation,
  InvestmentDeleteConfirmDialog,
  InvestmentListWidget,
  InvestmentPositionDetailPanel,
  InvestmentQuickAddWidget,
  InvestmentSummaryWidget,
  PageHeader,
  PullToRefreshIndicator,
  useInvestmentsPageModel,
} from "@/modules/investments";

export interface InvestmentsProps {
  avatarInitials?: string;
  headerTitle?: string;
  navItems?: NavItem[];
  onNavItemClick?: (index: number) => void;
}

export function Investments({
  avatarInitials,
  headerTitle = "Inversiones",
  navItems = DEFAULT_NAV_ITEMS,
  onNavItemClick,
}: InvestmentsProps) {
  const {
    rows,
    selectedRow,
    selectedEntries,
    summary,
    error,
    isLoading,
    isPullRefreshing,
    isEditorOpen,
    editingPositionId,
    isDetailOpen,
    isEntriesLoading,
    deletingEntryId,
    isDeleteConfirmOpen,
    pendingDeletePositionId,
    isDeleteSubmitting,
    uiMessage,
    pullProgress,
    pullState,
    pullContainerRef,
    handlePullTouchStart,
    handlePullTouchMove,
    handlePullTouchEnd,
    handlePullTouchCancel,
    assetTypeInput,
    entryTypeInput,
    tickerInput,
    usdSpentInput,
    buyPriceInput,
    createdAtInput,
    availableAmountLabel,
    isFormValid,
    showValidation,
    derivedAmountLabel,
    formValidationLabel,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseDetail,
    handleCloseEditor,
    handleOpenDetail,
    handleDeleteEntry,
    handleRequestDelete,
    handleCancelDelete,
    handleConfirmDelete,
    handleSubmit,
    dismissUiMessage,
    setAssetTypeInput,
    setEntryTypeInput,
    setTickerInput,
    setUsdSpentInput,
    setBuyPriceInput,
    setCreatedAtInput,
  } = useInvestmentsPageModel();

  const pendingDeleteTicker = pendingDeletePositionId
    ? rows.find((row) => row.id === pendingDeletePositionId)?.ticker
    : undefined;
  const pullOffset = Math.round(
    Math.min(24, pullProgress * 20 + (pullState === "refreshing" ? 8 : 0)),
  );

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <div className="border-b border-[#E5E7EB] bg-[var(--panel-bg)]">
        <PageHeader
          title={headerTitle}
          avatarInitials={avatarInitials}
          onActionClick={handleOpenCreate}
          actionIcon="plus"
          actionAriaLabel="Agregar entrada"
        />
      </div>

      <div
        ref={pullContainerRef}
        onTouchStart={handlePullTouchStart}
        onTouchMove={handlePullTouchMove}
        onTouchEnd={handlePullTouchEnd}
        onTouchCancel={handlePullTouchCancel}
        className="flex-1 overflow-auto bg-[#F3F4F6] overscroll-contain"
      >
        <div
          className="flex flex-col gap-3 px-5 py-3 transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: `translateY(${pullOffset}px)` }}
        >
          <PullToRefreshIndicator state={pullState} progress={pullProgress} />
          <InvestmentSummaryWidget summary={summary} />

          {uiMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`flex items-start justify-between gap-3 rounded-xl px-3 py-2 ${
                uiMessage.kind === "success"
                  ? "border border-[#BBF7D0] bg-[#F0FDF4]"
                  : "border border-[#FECACA] bg-[#FEF2F2]"
              }`}
            >
              <span
                className={`text-xs font-semibold ${
                  uiMessage.kind === "success" ? "text-[#15803D]" : "text-[#B91C1C]"
                }`}
              >
                {uiMessage.text}
              </span>
              <button
                type="button"
                onClick={dismissUiMessage}
                className="text-xs font-semibold text-[#6B7280]"
                aria-label="Cerrar mensaje"
              >
                Cerrar
              </button>
            </div>
          )}

          <InvestmentListWidget
            rows={rows}
            isLoading={isLoading || isPullRefreshing}
            errorMessage={error}
            onOpenDetail={handleOpenDetail}
          />
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} activeColor="text-[#2563EB]" />

      <InvestmentQuickAddWidget
        isOpen={isEditorOpen}
        isEditing={Boolean(editingPositionId)}
        isLoading={isLoading}
        isFormValid={isFormValid}
        showValidation={showValidation}
        assetTypeInput={assetTypeInput}
        entryTypeInput={entryTypeInput}
        tickerInput={tickerInput}
        usdSpentInput={usdSpentInput}
        buyPriceInput={buyPriceInput}
        createdAtInput={createdAtInput}
        availableAmountLabel={availableAmountLabel}
        derivedAmountLabel={derivedAmountLabel}
        validationMessage={formValidationLabel}
        onClose={handleCloseEditor}
        onSubmit={() => {
          void handleSubmit();
        }}
        onAssetTypeChange={setAssetTypeInput}
        onEntryTypeChange={setEntryTypeInput}
        onTickerChange={setTickerInput}
        onUsdSpentChange={setUsdSpentInput}
        onBuyPriceChange={setBuyPriceInput}
        onCreatedAtChange={setCreatedAtInput}
      />

      <InvestmentPositionDetailPanel
        isOpen={isDetailOpen}
        row={selectedRow}
        entries={selectedEntries}
        isEntriesLoading={isEntriesLoading}
        deletingEntryId={deletingEntryId}
        onClose={handleCloseDetail}
        onAddEntry={handleOpenEdit}
        onDeleteEntry={(entryId) => {
          void handleDeleteEntry(entryId);
        }}
        onRequestDelete={handleRequestDelete}
      />

      <InvestmentDeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        isLoading={isDeleteSubmitting}
        ticker={pendingDeleteTicker}
        onCancel={handleCancelDelete}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
