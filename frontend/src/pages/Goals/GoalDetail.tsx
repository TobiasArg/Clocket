import {
  ActionButton,
  IconBadge,
  PageHeader,
  PhosphorIcon,
  ProgressBar,
  formatCurrency,
  getGoalColorOption,
  useGoalDetailPageModel,
} from "@/modules/goals";

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
    deleteResolution,
    entries,
    entryAmountInput,
    entryDateInput,
    entryNoteInput,
    goal,
    handleAddEntry,
    handleDeleteGoal,
    isDeleteDialogOpen,
    isEntryFormValid,
    progressPercent,
    redirectAccountId,
    redirectGoalId,
    savedAmount,
    selectedEntryAccountId,
    setDeleteResolution,
    setEntryAmountInput,
    setEntryDateInput,
    setEntryNoteInput,
    setIsDeleteDialogOpen,
    setRedirectAccountId,
    setRedirectGoalId,
    setSelectedEntryAccountId,
    targetAmount,
    visibleAccounts,
    visibleGoalsForRedirect,
  } = useGoalDetailPageModel({ goalId });

  if (!goal) {
    return (
      <div className="flex flex-col h-full w-full bg-white">
        <PageHeader title="Goal" onBackClick={onBackClick} />
        <div className="flex-1 flex items-center justify-center px-6">
          <span className="text-sm font-medium text-[#71717A]">Goal no encontrado.</span>
        </div>
      </div>
    );
  }

  const color = getGoalColorOption(goal.colorKey);

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <PageHeader title="Goal" onBackClick={onBackClick} />

      <div className="flex-1 overflow-auto px-5 py-3">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[#F4F4F5] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <IconBadge
                  icon={goal.icon}
                  bg={color.iconBgClass}
                  iconColor="text-white"
                  size="w-[44px] h-[44px]"
                  rounded="rounded-xl"
                />
                <div className="min-w-0">
                  <span className="block truncate text-base font-semibold text-black font-['Outfit']">
                    {goal.title}
                  </span>
                  <span className="block truncate text-xs font-medium text-[#71717A]">
                    Límite: {goal.deadlineDate}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-9 w-9 rounded-lg bg-white flex items-center justify-center"
                aria-label="Delete goal"
              >
                <PhosphorIcon name="trash" className="text-[#DC2626]" size="text-[16px]" />
              </button>
            </div>

            <span className="text-sm font-medium text-[#52525B]">{goal.description}</span>

            <div className="flex items-end justify-between">
              <span className="text-lg font-bold text-black font-['Outfit']">
                {formatCurrency(savedAmount)}
              </span>
              <span className="text-sm font-medium text-[#71717A]">
                {`${progressPercent}% · ${formatCurrency(targetAmount)}`}
              </span>
            </div>
            <ProgressBar
              percent={progressPercent}
              barColor={color.barClass}
              trackColor="bg-[#E4E4E7]"
            />
          </div>

          <div className="rounded-2xl bg-[#F4F4F5] p-4 flex flex-col gap-3">
            <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">NUEVA ENTRADA</span>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">Monto</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={entryAmountInput}
                onChange={(event) => setEntryAmountInput(event.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                placeholder="0.00"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">Cuenta origen</span>
              <select
                value={selectedEntryAccountId}
                onChange={(event) => setSelectedEntryAccountId(event.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
              >
                <option value="">Seleccionar cuenta</option>
                {visibleAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">Fecha</span>
              <input
                type="date"
                value={entryDateInput}
                onChange={(event) => setEntryDateInput(event.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-[#52525B]">Nota</span>
              <input
                type="text"
                value={entryNoteInput}
                onChange={(event) => setEntryNoteInput(event.target.value)}
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
                placeholder="Ej. Transferencia mensual"
              />
            </label>

            <ActionButton
              icon="plus"
              label="Agregar entrada"
              iconColor="text-[#18181B]"
              labelColor="text-[#18181B]"
              bg={isEntryFormValid ? "bg-[#E4E4E7]" : "bg-[#F4F4F5]"}
              padding="px-4 py-3"
              className={isEntryFormValid ? "" : "opacity-70 pointer-events-none"}
              onClick={() => {
                void handleAddEntry();
              }}
            />
          </div>

          <div className="rounded-2xl bg-[#F4F4F5] p-4 flex flex-col gap-3">
            <span className="text-[11px] font-semibold text-[#71717A] tracking-[1px]">ENTRADAS</span>
            {entries.length === 0 ? (
              <span className="text-sm font-medium text-[#71717A]">No hay entradas todavía.</span>
            ) : (
              <div className="flex flex-col">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`py-2 flex items-center justify-between gap-2 ${
                      index < entries.length - 1 ? "border-b border-[#E4E4E7]" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-black">
                        {entry.note}
                      </span>
                      <span className="block truncate text-xs font-medium text-[#71717A]">
                        {entry.date}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[#DC2626]">
                      {entry.amountLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center px-5">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 flex flex-col gap-3">
            <span className="text-sm font-bold text-black font-['Outfit']">
              Eliminar goal
            </span>
            <span className="text-xs font-medium text-[#71717A]">
              Elige cómo resolver las entradas asociadas antes de eliminar.
            </span>

            <label className="flex items-start gap-2 text-xs font-medium text-black">
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
                className="w-full bg-[#F4F4F5] rounded-xl px-3 py-2 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
              >
                <option value="">Seleccionar goal destino</option>
                {visibleGoalsForRedirect.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            )}

            <label className="flex items-start gap-2 text-xs font-medium text-black">
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
                className="w-full bg-[#F4F4F5] rounded-xl px-3 py-2 text-sm font-medium text-black outline-none border border-transparent focus:border-[#D4D4D8]"
              >
                <option value="">Seleccionar cuenta destino</option>
                {visibleAccounts.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}

            <label className="flex items-start gap-2 text-xs font-medium text-black">
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
                className="rounded-xl border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold text-[#71717A]"
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
                  canConfirmDelete ? "bg-[#DC2626] text-white" : "bg-[#E4E4E7] text-[#A1A1AA]"
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
