import { useCallback } from "react";
import { GoalsQuickAddWidget } from "@/components/GoalsQuickAddWidget/GoalsQuickAddWidget";
import { IconBadge } from "@/components/IconBadge/IconBadge";
import { PageHeader } from "@/components/PageHeader/PageHeader";
import { PhosphorIcon } from "@/components/PhosphorIcon/PhosphorIcon";
import { ProgressBar } from "@/components/ProgressBar/ProgressBar";
import { TRANSACTION_EXPENSE_TEXT_CLASS } from "@/constants";
import { useGoalDetailPageModel } from "@/hooks/useGoalDetailPageModel";
import { formatCurrency, getGoalColorOption } from "@/utils";
import type { GoalColorKey } from "@/types";

export interface GoalDetailProps {
  goalId: string;
  onBackClick?: () => void;
}

export function GoalDetail({
  goalId,
  onBackClick,
}: GoalDetailProps) {
  const {
    canConfirmDelete,
    colorOptions,
    deadlineDateInput,
    deleteResolution,
    descriptionInput,
    entries,
    goal,
    handleCloseEdit,
    handleDeleteGoal,
    handleOpenEdit,
    handleSaveEdit,
    iconOptions,
    isDeadlineValid,
    isDeleteDialogOpen,
    isDescriptionValid,
    isEditFormValid,
    isEditSheetOpen,
    isLoading,
    isTargetValid,
    isTitleValid,
    progressPercent,
    redirectAccountId,
    redirectGoalId,
    savedAmount,
    selectedColorKey,
    selectedCurrency,
    selectedIcon,
    setDeadlineDateInput,
    setDeleteResolution,
    setDescriptionInput,
    setIsDeleteDialogOpen,
    setRedirectAccountId,
    setRedirectGoalId,
    setSelectedColorKey,
    setSelectedCurrency,
    setSelectedIcon,
    setTargetAmountInput,
    setTitleInput,
    showEditValidation,
    targetAmount,
    targetAmountInput,
    titleInput,
    visibleAccounts,
    visibleGoalsForRedirect,
  } = useGoalDetailPageModel({ goalId });

  const handleSaveEditVoid = useCallback(() => { void handleSaveEdit(); }, [handleSaveEdit]);
  const handleColorKeyChange = useCallback((value: string) => { setSelectedColorKey(value as GoalColorKey); }, [setSelectedColorKey]);

  if (!goal) {
    return (
      <div className="flex flex-col h-full w-full bg-[var(--panel-bg)]">
        <PageHeader title="Meta" onBackClick={onBackClick} />
        <div className="flex-1 flex items-center justify-center px-6">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Meta no encontrada.</span>
        </div>
      </div>
    );
  }

  const color = getGoalColorOption(goal.colorKey);
  const remainingAmount = Math.max(0, targetAmount - savedAmount);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--panel-bg)]">
      <PageHeader title="Meta" onBackClick={onBackClick} />

      <div className="flex-1 overflow-auto px-5 py-3">
        <div className="flex flex-col gap-4 pb-8">
          <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-muted)] p-4 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <IconBadge
                  icon={goal.icon}
                  bg={color.iconBgClass}
                  iconColor="text-white"
                  size="w-[48px] h-[48px]"
                  rounded="rounded-xl"
                />
                <div className="min-w-0">
                  <span className="block truncate text-base font-semibold text-[var(--text-primary)] font-['Outfit']">
                    {goal.title}
                  </span>
                  <span className="block truncate text-xs font-medium text-[var(--text-secondary)]">
                    Límite: {goal.deadlineDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="h-9 w-9 rounded-lg bg-[var(--panel-bg)] border border-[var(--surface-border)] flex items-center justify-center"
                  aria-label="Editar meta"
                >
                  <PhosphorIcon name="pencil-simple" className="text-[var(--text-secondary)]" size="text-[16px]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="h-9 w-9 rounded-lg bg-[#FEE2E2] flex items-center justify-center"
                  aria-label="Eliminar meta"
                >
                  <PhosphorIcon name="trash" className="text-[#DC2626]" size="text-[16px]" />
                </button>
              </div>
            </div>

            <span className="text-sm font-medium text-[var(--text-secondary)]">{goal.description}</span>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[var(--panel-bg)] border border-[var(--surface-border)] px-3 py-2">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
                  Guardado
                </span>
                <span className="block mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {formatCurrency(savedAmount)}
                </span>
              </div>
              <div className="rounded-xl bg-[var(--panel-bg)] border border-[var(--surface-border)] px-3 py-2">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
                  Objetivo
                </span>
                <span className="block mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {formatCurrency(targetAmount)}
                </span>
              </div>
              <div className="rounded-xl bg-[var(--panel-bg)] border border-[var(--surface-border)] px-3 py-2">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-secondary)]">
                  Restante
                </span>
                <span className="block mt-1 text-sm font-semibold text-[var(--text-primary)]">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <span className={`text-sm font-semibold ${color.textClass}`}>
                {progressPercent}% completado
              </span>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {entries.length} movimientos vinculados
              </span>
            </div>

            <ProgressBar
              percent={progressPercent}
              barColor={color.barClass}
              trackColor="bg-[var(--surface-border)]"
            />
          </div>

          <div className="rounded-2xl bg-[var(--surface-muted)] p-4 flex flex-col gap-3 border border-[var(--surface-border)]">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-[1px]">
              MOVIMIENTOS DEL GOAL
            </span>
            {entries.length === 0 ? (
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Este goal todavía no tiene movimientos asociados.
              </span>
            ) : (
              <div className="flex flex-col">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`py-2.5 flex items-center justify-between gap-2 ${
                      index < entries.length - 1 ? "border-b border-[var(--surface-border)]" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                        {entry.note}
                      </span>
                      <span className="block truncate text-xs font-medium text-[var(--text-secondary)]">
                        {entry.date}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${TRANSACTION_EXPENSE_TEXT_CLASS}`}>
                      {entry.amountLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <GoalsQuickAddWidget
        isOpen={isEditSheetOpen}
        title="Editar meta"
        onRequestClose={handleCloseEdit}
        onSubmit={handleSaveEditVoid}
        isFormValid={isEditFormValid}
        isLoading={isLoading}
        showValidation={showEditValidation}
        titleInput={titleInput}
        onTitleChange={setTitleInput}
        isTitleValid={isTitleValid}
        descriptionInput={descriptionInput}
        onDescriptionChange={setDescriptionInput}
        isDescriptionValid={isDescriptionValid}
        targetAmountInput={targetAmountInput}
        onTargetAmountChange={setTargetAmountInput}
        isTargetValid={isTargetValid}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
        deadlineDateInput={deadlineDateInput}
        onDeadlineDateChange={setDeadlineDateInput}
        isDeadlineValid={isDeadlineValid}
        selectedIcon={selectedIcon}
        onIconChange={setSelectedIcon}
        iconOptions={iconOptions}
        selectedColorKey={selectedColorKey}
        onColorKeyChange={handleColorKeyChange}
        colorOptions={colorOptions}
        quickAddSubmitLabel="Guardar cambios"
      />

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center px-5">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--panel-bg)] p-4 flex flex-col gap-3">
            <span className="text-sm font-bold text-[var(--text-primary)] font-['Outfit']">
              Eliminar goal
            </span>
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Elige cómo resolver las entradas asociadas antes de eliminar.
            </span>

            <label className="flex items-start gap-2 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="radio"
                checked={deleteResolution === "redirect_goal"}
                onChange={() => setDeleteResolution("redirect_goal")}
              />
              <span>Redirigir entradas a otro Goal</span>
            </label>
            {deleteResolution === "redirect_goal" && (
              <select
                value={redirectGoalId}
                onChange={(event) => setRedirectGoalId(event.target.value)}
                className="w-full bg-[var(--surface-muted)] rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[#D4D4D8]"
              >
                <option value="">Seleccionar goal destino</option>
                {visibleGoalsForRedirect.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            )}

            <label className="flex items-start gap-2 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="radio"
                checked={deleteResolution === "redirect_account"}
                onChange={() => setDeleteResolution("redirect_account")}
              />
              <span>Redirigir entradas a una cuenta</span>
            </label>
            {deleteResolution === "redirect_account" && (
              <select
                value={redirectAccountId}
                onChange={(event) => setRedirectAccountId(event.target.value)}
                className="w-full bg-[var(--surface-muted)] rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-primary)] outline-none border border-transparent focus:border-[#D4D4D8]"
              >
                <option value="">Seleccionar cuenta destino</option>
                {visibleAccounts.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}

            <label className="flex items-start gap-2 text-xs font-medium text-[var(--text-primary)]">
              <input
                type="radio"
                checked={deleteResolution === "delete_entries"}
                onChange={() => setDeleteResolution("delete_entries")}
              />
              <span>Eliminar entradas</span>
            </label>

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-xl border border-[var(--surface-border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canConfirmDelete}
                onClick={() => {
                  void handleDeleteGoal().then((removed) => {
                    if (removed) {
                      onBackClick?.();
                    }
                  });
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  canConfirmDelete ? "bg-[#DC2626] text-white" : "bg-[var(--surface-border)] text-[var(--text-secondary)]"
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
