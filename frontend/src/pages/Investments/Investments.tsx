import { DEFAULT_NAV_ITEMS } from "@/constants";
import type { NavItem } from "@/modules/investments";
import {
  Avatar,
  BottomNavigation,
  IconBadge,
  InvestmentListWidget,
  InvestmentQuickAddWidget,
  InvestmentSummaryWidget,
  useInvestmentsPageModel,
} from "@/modules/investments";

export interface InvestmentsProps {
  avatarInitials?: string;
  avatarBg?: string;
  headerTitle?: string;
  addButtonBg?: string;
  summaryTitle?: string;
  totalLabel?: string;
  totalArsLabel?: string;
  gainLabel?: string;
  dayGainLabel?: string;
  listTitle?: string;
  quickAddTitle?: string;
  quickAddTickerLabel?: string;
  quickAddNameLabel?: string;
  quickAddSharesLabel?: string;
  quickAddCostBasisLabel?: string;
  quickAddCurrentPriceLabel?: string;
  quickAddSubmitLabel?: string;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyHint?: string;
  errorLabel?: string;
  deleteActionLabel?: string;
  navItems?: NavItem[];
  onAddClick?: () => void;
  onStockClick?: (index: number) => void;
  onNavItemClick?: (index: number) => void;
}

export function Investments({
  avatarInitials = "JS",
  avatarBg = "bg-[#10B981]",
  headerTitle = "Inversiones",
  addButtonBg = "bg-[#F4F4F5]",
  summaryTitle = "Resumen del Portfolio",
  totalLabel = "Valor Total",
  totalArsLabel = "Equivalente ARS",
  gainLabel = "Ganancia/Pérdida",
  dayGainLabel = "Variación diaria",
  listTitle = "Mis Acciones",
  quickAddTitle = "Nueva inversión",
  quickAddTickerLabel = "Ticker",
  quickAddNameLabel = "Nombre",
  quickAddSharesLabel = "Cantidad",
  quickAddCostBasisLabel = "Costo promedio",
  quickAddCurrentPriceLabel = "Precio actual",
  quickAddSubmitLabel = "Guardar inversión",
  loadingLabel = "Cargando inversiones...",
  emptyTitle = "No hay inversiones",
  emptyHint = "Agrega tu primera posición para seguir tu portfolio.",
  errorLabel = "No pudimos cargar inversiones. Intenta nuevamente.",
  deleteActionLabel = "Eliminar",
  navItems = DEFAULT_NAV_ITEMS,
  onAddClick,
  onStockClick,
  onNavItemClick,
}: InvestmentsProps) {
  const {
    cardItems,
    currentPriceInput,
    costBasisInput,
    dayGainChange,
    error,
    handleCreate,
    handleHeaderAction,
    handleRemove,
    isEditorOpen,
    isFormValid,
    isLoading,
    isManualPriceEnabled,
    nameInput,
    setCostBasisInput,
    setCurrentPriceInput,
    setIsManualPriceEnabled,
    setNameInput,
    setSharesInput,
    setTickerInput,
    sharesInput,
    showValidation,
    summary,
    summaryChange,
    tickerInput,
  } = useInvestmentsPageModel({ onAddClick });

  return (
    <div className="flex flex-col h-full w-full bg-[#F5F5F5]">
      <div className="flex items-center justify-between px-5 py-4 bg-white">
        <div className="flex items-center gap-3">
          <Avatar
            initials={avatarInitials}
            bg={avatarBg}
            size="w-[40px] h-[40px]"
            textSize="text-sm"
            className="rounded-[20px]"
          />
          <span className="text-xl font-semibold text-[#18181B] font-['Outfit']">{headerTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleHeaderAction} aria-label="Agregar inversión">
            <IconBadge
              icon={isEditorOpen ? "x" : "plus"}
              bg={addButtonBg}
              iconColor="text-[#3F3F46]"
              size="w-[44px] h-[44px]"
              rounded="rounded-full"
            />
          </button>
        </div>
      </div>

      <InvestmentQuickAddWidget
        isOpen={isEditorOpen}
        quickAddTitle={quickAddTitle}
        quickAddTickerLabel={quickAddTickerLabel}
        quickAddNameLabel={quickAddNameLabel}
        quickAddSharesLabel={quickAddSharesLabel}
        quickAddCostBasisLabel={quickAddCostBasisLabel}
        quickAddCurrentPriceLabel={quickAddCurrentPriceLabel}
        quickAddSubmitLabel={quickAddSubmitLabel}
        tickerInput={tickerInput}
        nameInput={nameInput}
        sharesInput={sharesInput}
        costBasisInput={costBasisInput}
        currentPriceInput={currentPriceInput}
        isManualPriceEnabled={isManualPriceEnabled}
        showValidation={showValidation}
        isFormValid={isFormValid}
        isLoading={isLoading}
        onTickerChange={setTickerInput}
        onNameChange={setNameInput}
        onSharesChange={setSharesInput}
        onCostBasisChange={setCostBasisInput}
        onCurrentPriceChange={setCurrentPriceInput}
        onManualPriceEnabledChange={setIsManualPriceEnabled}
        onSubmit={() => {
          void handleCreate();
        }}
      />

      <InvestmentSummaryWidget
        summaryTitle={summaryTitle}
        totalLabel={totalLabel}
        totalValue={summary.current}
        totalArsLabel={totalArsLabel}
        totalArsValue={summary.currentArs}
        gainLabel={gainLabel}
        gainAmount={summary.gainAmount}
        summaryChange={summaryChange}
        dayGainLabel={dayGainLabel}
        dayGainAmount={summary.dayGainAmount}
        dayGainPresentation={dayGainChange}
      />

      <div className="flex-1 overflow-auto px-5 py-4">
        <InvestmentListWidget
          listTitle={listTitle}
          loadingLabel={loadingLabel}
          errorLabel={errorLabel}
          emptyTitle={emptyTitle}
          emptyHint={emptyHint}
          isLoading={isLoading}
          errorMessage={error}
          deleteActionLabel={deleteActionLabel}
          items={cardItems}
          onStockClick={onStockClick}
          onDelete={(id) => {
            void handleRemove(id);
          }}
        />
      </div>

      <BottomNavigation
        items={navItems}
        activeColor="text-[#10B981]"
        onItemClick={onNavItemClick}
      />
    </div>
  );
}
