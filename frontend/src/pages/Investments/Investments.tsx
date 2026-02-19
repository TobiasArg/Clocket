import { DEFAULT_NAV_ITEMS } from "@/constants";
import type { NavItem } from "@/modules/investments";
import {
  Avatar,
  BottomNavigation,
  InvestmentListWidget,
  InvestmentQuickAddWidget,
  InvestmentSummaryWidget,
  useInvestmentsPageModel,
} from "@/modules/investments";

export interface InvestmentsProps {
  avatarInitials?: string;
  headerTitle?: string;
  navItems?: NavItem[];
  onNavItemClick?: (index: number) => void;
}

export function Investments({
  avatarInitials = "JS",
  headerTitle = "Investments Portfolio",
  navItems = [
    { icon: "house", label: "Home", to: "/home" },
    { icon: "wallet", label: "Budgets", to: "/budgets" },
    { icon: "chart-pie-slice", label: "Statistics", to: "/statistics" },
    { icon: "trend-up", label: "Inversiones", active: true, to: "/investments" },
    { icon: "dots-three-outline", label: "Más", to: "/more" },
  ],
  onNavItemClick,
}: InvestmentsProps) {
  const {
    rows,
    summary,
    error,
    isLoading,
    isRefreshingAll,
    isEditorOpen,
    editingPositionId,
    expandedRowId,
    assetTypeInput,
    tickerInput,
    usdSpentInput,
    buyPriceInput,
    isFormValid,
    showValidation,
    derivedAmountLabel,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseEditor,
    handleToggleRowExpand,
    handleRefreshAll,
    handleRefreshRow,
    handleDelete,
    handleSubmit,
    setAssetTypeInput,
    setTickerInput,
    setUsdSpentInput,
    setBuyPriceInput,
  } = useInvestmentsPageModel();

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F3F4F6]">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            initials={avatarInitials}
            bg="bg-[#2563EB]"
            size="w-[40px] h-[40px]"
            textSize="text-sm"
            className="rounded-[20px]"
          />
          <div className="flex flex-col">
            <span className="text-xl font-semibold text-[#111827] font-['Outfit']">{headerTitle}</span>
            <span className="text-[11px] font-medium text-[#6B7280]">
              Base currency: USD • Tracking propio con snapshots
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void handleRefreshAll();
            }}
            className="rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-xs font-semibold text-[#374151]"
          >
            {isRefreshingAll ? "Refreshing..." : "Refresh all"}
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white"
          >
            Add position
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-5 py-4">
        <div className="flex flex-col gap-4">
          <InvestmentSummaryWidget summary={summary} />

          <InvestmentListWidget
            rows={rows}
            isLoading={isLoading}
            errorMessage={error}
            expandedRowId={expandedRowId}
            onRefreshRow={(id) => {
              void handleRefreshRow(id);
            }}
            onEdit={handleOpenEdit}
            onDelete={(id) => {
              void handleDelete(id);
            }}
            onToggleExpand={handleToggleRowExpand}
          />
        </div>
      </div>

      <InvestmentQuickAddWidget
        isOpen={isEditorOpen}
        isEditing={Boolean(editingPositionId)}
        isLoading={isLoading}
        isFormValid={isFormValid}
        showValidation={showValidation}
        assetTypeInput={assetTypeInput}
        tickerInput={tickerInput}
        usdSpentInput={usdSpentInput}
        buyPriceInput={buyPriceInput}
        derivedAmountLabel={derivedAmountLabel}
        onClose={handleCloseEditor}
        onSubmit={() => {
          void handleSubmit();
        }}
        onAssetTypeChange={setAssetTypeInput}
        onTickerChange={setTickerInput}
        onUsdSpentChange={setUsdSpentInput}
        onBuyPriceChange={setBuyPriceInput}
      />

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} activeColor="text-[#2563EB]" />
    </div>
  );
}
