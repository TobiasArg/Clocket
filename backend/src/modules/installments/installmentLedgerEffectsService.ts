import { CoreFinanceApiError } from "../core-finance/coreFinanceApiErrors";
import {
  toInstallmentPlanResponse,
  type GeneratedInstallmentTransactionEffectResponse,
  type MarkInstallmentPaidResponse,
  type ReconcileDueInstallmentsResponse,
  type ReconciledInstallmentPlanResponse,
} from "./installmentPlansContracts";
import type {
  GeneratedInstallmentLedgerEffectRecord,
  InstallmentPlansRepository,
  MarkNextDuePaidResult,
  ReconcileDueResult,
} from "./installmentPlansRepository";

export interface InstallmentLedgerEffectsService {
  markInstallmentPaid: (id: string) => Promise<MarkInstallmentPaidResponse>;
  reconcileDueInstallments: () => Promise<ReconcileDueInstallmentsResponse>;
}

const toEffectResponse = (
  effect: GeneratedInstallmentLedgerEffectRecord,
): GeneratedInstallmentTransactionEffectResponse => ({
  planId: effect.planId,
  installmentIndex: effect.installmentIndex,
  status: effect.status,
});

const toMarkPaidResponse = (result: MarkNextDuePaidResult): MarkInstallmentPaidResponse => ({
  plan: toInstallmentPlanResponse(result.plan),
  status: result.status,
  installmentIndex: result.installmentIndex,
  dueDate: result.dueDate,
  ...(result.status === "blocked_future" ? { blockedReason: "future_installment" as const } : {}),
  effects: result.effects.map(toEffectResponse),
});

const toReconciledPlanResponse = (
  result: ReconcileDueResult,
): ReconciledInstallmentPlanResponse => ({
  plan: toInstallmentPlanResponse(result.plan),
  status: result.fromPaidInstallmentsCount === result.toPaidInstallmentsCount &&
    result.effects.every((effect) => effect.status === "already_exists")
    ? "noop"
    : "reconciled",
  fromPaidInstallmentsCount: result.fromPaidInstallmentsCount,
  toPaidInstallmentsCount: result.toPaidInstallmentsCount,
  effects: result.effects.map(toEffectResponse),
});

export const createInstallmentLedgerEffectsService = ({
  repository,
  now = () => new Date(),
}: {
  repository: Pick<InstallmentPlansRepository, "markNextDuePaid" | "reconcileDue">;
  now?: () => Date;
}): InstallmentLedgerEffectsService => ({
  async markInstallmentPaid(id) {
    const result = await repository.markNextDuePaid(id, now());

    if (!result) {
      throw new CoreFinanceApiError(`Installment plan '${id}' was not found.`, {
        code: "NOT_FOUND",
        status: 404,
      });
    }

    return toMarkPaidResponse(result);
  },

  async reconcileDueInstallments() {
    const results = (await repository.reconcileDue(now())).map(toReconciledPlanResponse);
    return {
      updatedPlanCount: results.filter(
        (result) => result.toPaidInstallmentsCount > result.fromPaidInstallmentsCount,
      ).length,
      createdTransactionCount: results.reduce(
        (count, result) => count + result.effects.filter((effect) => effect.status === "created").length,
        0,
      ),
      results,
    };
  },
});
