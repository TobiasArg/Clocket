import { useCallback } from "react";
import { DEFAULT_NAV_ITEMS } from "@/constants";
import type {
  CuotaItem,
  GoalCardSimple,
  NavItem,
  SpendingCategory,
  Transaction,
} from "@/modules/home";
import {
  Avatar,
  BalanceWidget,
  BottomNavigation,
  GoalsWidget,
  IconBadge,
  InstallmentPlansWidget,
  RecentTransactionsWidget,
  SpendingInfoWidget,
  useHomePageModel,
} from "@/modules/home";
import { TransactionEditorWidget, useTransactionsPageModel } from "@/modules/transactions";

export interface HomeProps {
  avatarInitials?: string;
  greeting?: string;
  userName?: string;
  totalBalance?: string;
  incomeLabel?: string;
  incomeValue?: string;
  expenseLabel?: string;
  expenseValue?: string;
  activeDot?: number;
  recentTitle?: string;
  recentViewAll?: string;
  transactions?: Transaction[];
  spendingTitle?: string;
  spendingTotal?: string;
  spendingCategories?: SpendingCategory[];
  spendingPendingLabel?: string;
  goalsTitle?: string;
  goals?: GoalCardSimple[];
  cuotasTitle?: string;
  cuotasViewAll?: string;
  cuotas?: CuotaItem[];
  navItems?: NavItem[];
  loadingLabel?: string;
  errorLabel?: string;
  emptyTransactionsLabel?: string;
  emptySpendingLabel?: string;
  emptyCuotasLabel?: string;
  onNavItemClick?: (index: number) => void;
  onAddTransactionClick?: () => void;
  onSeeAllTransactions?: () => void;
  onSeeAllCuotas?: () => void;
  onGoalClick?: (goalId: string) => void;
}

export function Home({
  avatarInitials = "JS",
  greeting = "Buenos días",
  userName = "John",
  totalBalance,
  incomeLabel = "Ing.",
  incomeValue,
  expenseLabel = "Gas.",
  expenseValue,
  activeDot = 0,
  recentTitle = "Recientes",
  recentViewAll = "Ver todos",
  transactions,
  spendingTitle = "Gastos",
  spendingTotal,
  spendingCategories,
  spendingPendingLabel = "Cuotas pendientes",
  goalsTitle = "Metas",
  goals,
  cuotasTitle = "Planes de Cuotas",
  cuotasViewAll = "Ver todos",
  cuotas,
  navItems = DEFAULT_NAV_ITEMS,
  loadingLabel = "Cargando...",
  errorLabel = "No pudimos cargar esta sección. Intenta nuevamente.",
  emptyTransactionsLabel = "Aún no hay transacciones.",
  emptySpendingLabel = "Sin gastos este mes.",
  emptyCuotasLabel = "Sin cuotas activas.",
  onNavItemClick,
  onAddTransactionClick,
  onSeeAllTransactions,
  onSeeAllCuotas,
  onGoalClick,
}: HomeProps) {
  const {
    activeBalanceSlide,
    balanceSlides,
    dashboardGoals,
    displayedSpendingCategories,
    displayedSpendingTotal,
    hasCuotasError,
    hasTransactionsError,
    isCuotasLoading,
    isTransactionsLoading,
    pendingInstallmentsLabel,
    recentTransactions,
    setActiveBalanceSlide,
    visibleCuotas,
  } = useHomePageModel({
    activeDot,
    transactions,
    spendingTotal,
    spendingCategories,
    totalBalance,
    incomeValue,
    expenseValue,
    cuotas,
    loadingLabel,
  });

  const {
    accountsError,
    amountInput,
    categoriesError,
    descriptionInput,
    editorMode,
    editingAmountSign,
    handleCloseEditor,
    handleHeaderAction,
    handleSubmit,
    isAccountValid,
    isAccountsLoading,
    isAmountValid,
    isCategoriesLoading,
    isCategoryValid,
    isDescriptionValid,
    isEditorOpen,
    isFormValid,
    isLoading,
    selectedAccountId,
    selectedCurrency,
    selectedCategoryId,
    selectedSubcategoryName,
    setAmountInput,
    setDescriptionInput,
    setEditingAmountSign,
    setSelectedAccountId,
    setSelectedCategoryId,
    setSelectedCurrency,
    setSelectedSubcategoryName,
    showValidation,
    sortedAccounts,
    sortedCategories,
  } = useTransactionsPageModel();

  const handleAddTransactionPress = useCallback(() => {
    handleHeaderAction();
    onAddTransactionClick?.();
  }, [handleHeaderAction, onAddTransactionClick]);

  const handleSubmitVoid = useCallback(() => { void handleSubmit(); }, [handleSubmit]);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--panel-bg)]">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar initials={avatarInitials} size="w-[44px] h-[44px]" />
          <div className="flex flex-col">
            <span className="text-sm font-normal text-[var(--text-secondary)]">{greeting}</span>
            <span className="text-lg font-bold text-[var(--text-primary)] font-['Outfit']">{userName}</span>
          </div>
        </div>
        <button type="button" onClick={handleAddTransactionPress} aria-label="Agregar transacción">
          <IconBadge
            icon={isEditorOpen ? "x" : "plus"}
            bg="bg-[var(--surface-muted)]"
            iconColor="text-[var(--text-primary)]"
            size="w-[44px] h-[44px]"
            rounded="rounded-full"
          />
        </button>
      </div>

      <div className={`flex-1 overflow-auto ${isEditorOpen ? "pointer-events-none" : ""}`}>
        <div className="flex flex-col gap-4 px-5 pb-5">
          <div className="mt-2">
            <BalanceWidget
              activeSlide={activeBalanceSlide}
              slides={balanceSlides}
              onSlideChange={setActiveBalanceSlide}
              incomeLabel={incomeLabel}
              expenseLabel={expenseLabel}
            />
          </div>

          <RecentTransactionsWidget
            title={recentTitle}
            viewAllLabel={recentViewAll}
            onViewAll={onSeeAllTransactions}
            isLoading={isTransactionsLoading && !transactions && recentTransactions.length === 0}
            hasError={!transactions && hasTransactionsError}
            showEmpty={
              !transactions &&
              !hasTransactionsError &&
              recentTransactions.length === 0 &&
              !isTransactionsLoading
            }
            emptyLabel={emptyTransactionsLabel}
            errorLabel={errorLabel}
            transactions={recentTransactions}
          />

          <SpendingInfoWidget
            title={spendingTitle}
            total={displayedSpendingTotal}
            pendingInstallmentsLabel={spendingPendingLabel}
            pendingInstallmentsValue={pendingInstallmentsLabel}
            isLoading={
              isTransactionsLoading &&
              !spendingCategories &&
              displayedSpendingCategories.length === 0
            }
            showEmpty={
              !spendingCategories &&
              displayedSpendingCategories.length === 0 &&
              !isTransactionsLoading
            }
            loadingLabel={loadingLabel}
            emptyLabel={emptySpendingLabel}
            categories={displayedSpendingCategories}
          />

          <GoalsWidget
            title={goalsTitle}
            goals={goals ?? dashboardGoals}
            onGoalClick={onGoalClick}
          />

          <InstallmentPlansWidget
            title={cuotasTitle}
            viewAllLabel={cuotasViewAll}
            onViewAll={onSeeAllCuotas}
            isLoading={!cuotas && isCuotasLoading && visibleCuotas.length === 0}
            hasError={!cuotas && hasCuotasError}
            showEmpty={
              !cuotas &&
              !hasCuotasError &&
              visibleCuotas.length === 0 &&
              !isCuotasLoading
            }
            loadingLabel={loadingLabel}
            errorLabel={errorLabel}
            emptyLabel={emptyCuotasLabel}
            cuotas={visibleCuotas}
          />
        </div>
      </div>

      <BottomNavigation items={navItems} onItemClick={onNavItemClick} />

      <TransactionEditorWidget
        isOpen={isEditorOpen}
        editorMode={editorMode}
        quickAddTitle="Nueva transacción"
        editTitle="Editar transacción"
        quickAddTypeLabel="Tipo"
        quickAddExpenseLabel="Egreso"
        quickAddIncomeLabel="Ingreso"
        quickAddAmountLabel="Monto"
        quickAddAmountPlaceholder="0.00"
        quickAddAmountErrorLabel="Ingresa un monto mayor a 0."
        quickAddDescriptionLabel="Descripción (opcional)"
        quickAddDescriptionPlaceholder="Ej. Café, Uber, supermercado"
        quickAddDescriptionErrorLabel="Puedes dejarlo vacío."
        quickAddAccountLabel="Cuenta"
        quickAddCurrencyLabel="Moneda"
        quickAddAccountErrorLabel="Selecciona una cuenta."
        quickAddCategoryLabel="Categoría"
        quickAddSubmitLabel="Agregar transacción"
        editSubmitLabel="Guardar cambios"
        uncategorizedLabel="Sin categoría"
        uncategorizedAccountLabel="Sin cuenta"
        noAccountsLabel="Crea una cuenta en Más > Cuentas para registrar transacciones."
        amountInput={amountInput}
        descriptionInput={descriptionInput}
        selectedAccountId={selectedAccountId}
        selectedCurrency={selectedCurrency}
        selectedCategoryId={selectedCategoryId}
        selectedSubcategoryName={selectedSubcategoryName}
        editingAmountSign={editingAmountSign}
        showValidation={showValidation}
        isAmountValid={isAmountValid}
        isDescriptionValid={isDescriptionValid}
        isAccountValid={isAccountValid}
        isCategoryValid={isCategoryValid}
        isFormValid={isFormValid}
        isLoading={isLoading}
        isAccountsLoading={isAccountsLoading}
        isCategoriesLoading={isCategoriesLoading}
        accountsError={accountsError}
        categoriesError={categoriesError}
        sortedAccounts={sortedAccounts}
        sortedCategories={sortedCategories}
        onAmountChange={setAmountInput}
        onDescriptionChange={setDescriptionInput}
        onSelectedAccountIdChange={setSelectedAccountId}
        onCurrencyChange={setSelectedCurrency}
        onSelectedCategoryIdChange={setSelectedCategoryId}
        onSelectedSubcategoryNameChange={setSelectedSubcategoryName}
        onSignChange={setEditingAmountSign}
        onRequestClose={handleCloseEditor}
        onSubmit={handleSubmitVoid}
      />
    </div>
  );
}
