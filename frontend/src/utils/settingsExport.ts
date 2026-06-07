import {
  httpAccountsRepository,
  httpAppSettingsRepository,
  httpBudgetsRepository,
  httpCategoriesRepository,
  httpCuotasRepository,
  httpGoalsRepository,
  httpInvestmentsRepository,
  httpTransactionsRepository,
} from "@/data/http";
import type { AccountsRepository } from "@/domain/accounts/repository";
import type { AppSettingsRepository } from "@/domain/app-settings/repository";
import type { BudgetsRepository } from "@/domain/budgets/repository";
import type { CategoriesRepository } from "@/domain/categories/repository";
import type { CuotasRepository } from "@/domain/cuotas/repository";
import type { GoalsRepository } from "@/domain/goals/repository";
import type { InvestmentsRepository } from "@/domain/investments/repository";
import type { TransactionItem, TransactionsRepository } from "@/domain/transactions/repository";

export interface SettingsExportRepositories {
  accountsRepository: AccountsRepository;
  appSettingsRepository: AppSettingsRepository;
  budgetsRepository: BudgetsRepository;
  categoriesRepository: CategoriesRepository;
  cuotasRepository: CuotasRepository;
  goalsRepository: GoalsRepository;
  investmentsRepository: InvestmentsRepository;
  transactionsRepository: TransactionsRepository;
}

export const defaultSettingsExportRepositories: SettingsExportRepositories = {
  accountsRepository: httpAccountsRepository,
  appSettingsRepository: httpAppSettingsRepository,
  budgetsRepository: httpBudgetsRepository,
  categoriesRepository: httpCategoriesRepository,
  cuotasRepository: httpCuotasRepository,
  goalsRepository: httpGoalsRepository,
  investmentsRepository: httpInvestmentsRepository,
  transactionsRepository: httpTransactionsRepository,
};

export interface SettingsExportSnapshot {
  exportedAt: string;
  version: number;
  data: {
    settings: Awaited<ReturnType<AppSettingsRepository["get"]>>;
    accounts: Awaited<ReturnType<AccountsRepository["list"]>>;
    categories: Awaited<ReturnType<CategoriesRepository["list"]>>;
    budgets: Awaited<ReturnType<BudgetsRepository["list"]>>;
    goals: Awaited<ReturnType<GoalsRepository["list"]>>;
    cuotas: Awaited<ReturnType<CuotasRepository["list"]>>;
    transactions: Awaited<ReturnType<TransactionsRepository["list"]>>;
    investments: {
      positions: Awaited<ReturnType<InvestmentsRepository["listPositions"]>>;
      refs: Awaited<ReturnType<InvestmentsRepository["getRefsMap"]>>;
    };
  };
}

const escapeCsvValue = (value: string): string => `"${value.replaceAll("\"", "\"\"")}"`;

const triggerBrowserDownload = (blob: Blob, fileName: string): void => {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const buildTransactionsCsv = (transactions: TransactionItem[]): string => {
  const headers = [
    "id",
    "date",
    "name",
    "category",
    "amount",
    "accountId",
    "transactionType",
    "goalId",
    "meta",
  ];

  const rows = transactions.map((item) => {
    const values = [
      item.id,
      item.date,
      item.name,
      item.category,
      item.amount,
      item.accountId,
      item.transactionType,
      item.goalId ?? "",
      item.meta,
    ];

    return values.map((value) => escapeCsvValue(String(value))).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
};

export const buildExportSnapshot = async (
  repositories: SettingsExportRepositories = defaultSettingsExportRepositories,
): Promise<SettingsExportSnapshot> => {
  const {
    accountsRepository,
    appSettingsRepository,
    budgetsRepository,
    categoriesRepository,
    cuotasRepository,
    goalsRepository,
    investmentsRepository,
    transactionsRepository,
  } = repositories;

  const [
    settings,
    accounts,
    categories,
    budgets,
    goals,
    cuotas,
    transactions,
    positions,
    refs,
  ] = await Promise.all([
    appSettingsRepository.get(),
    accountsRepository.list(),
    categoriesRepository.list(),
    budgetsRepository.list(),
    goalsRepository.list(),
    cuotasRepository.list(),
    transactionsRepository.list(),
    investmentsRepository.listPositions(),
    investmentsRepository.getRefsMap(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      settings,
      accounts,
      categories,
      budgets,
      goals,
      cuotas,
      transactions,
      investments: {
        positions,
        refs,
      },
    },
  };
};

export const downloadJsonExport = async (
  repositories: SettingsExportRepositories = defaultSettingsExportRepositories,
): Promise<void> => {
  const snapshot = await buildExportSnapshot(repositories);
  const payload = JSON.stringify(snapshot, null, 2);
  triggerBrowserDownload(
    new Blob([payload], { type: "application/json;charset=utf-8" }),
    "clocket-backup.json",
  );
};

export const downloadTransactionsCsvExport = async (
  repository: TransactionsRepository = httpTransactionsRepository,
): Promise<void> => {
  const transactions = await repository.list();
  const csv = buildTransactionsCsv(transactions);
  triggerBrowserDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    "clocket-transactions.csv",
  );
};
