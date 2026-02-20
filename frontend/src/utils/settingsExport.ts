import {
  accountsRepository,
  appSettingsRepository,
  budgetsRepository,
  categoriesRepository,
  cuotasRepository,
  goalsRepository,
  investmentsRepository,
  transactionsRepository,
} from "@/data/localStorage";
import type { TransactionItem } from "@/domain/transactions/repository";

export interface SettingsExportSnapshot {
  exportedAt: string;
  version: number;
  data: {
    settings: Awaited<ReturnType<typeof appSettingsRepository.get>>;
    accounts: Awaited<ReturnType<typeof accountsRepository.list>>;
    categories: Awaited<ReturnType<typeof categoriesRepository.list>>;
    budgets: Awaited<ReturnType<typeof budgetsRepository.list>>;
    goals: Awaited<ReturnType<typeof goalsRepository.list>>;
    cuotas: Awaited<ReturnType<typeof cuotasRepository.list>>;
    transactions: Awaited<ReturnType<typeof transactionsRepository.list>>;
    investments: {
      positions: Awaited<ReturnType<typeof investmentsRepository.listPositions>>;
      refs: Awaited<ReturnType<typeof investmentsRepository.getRefsMap>>;
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

export const buildExportSnapshot = async (): Promise<SettingsExportSnapshot> => {
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

export const downloadJsonExport = async (): Promise<void> => {
  const snapshot = await buildExportSnapshot();
  const payload = JSON.stringify(snapshot, null, 2);
  triggerBrowserDownload(
    new Blob([payload], { type: "application/json;charset=utf-8" }),
    "clocket-backup.json",
  );
};

export const downloadTransactionsCsvExport = async (): Promise<void> => {
  const transactions = await transactionsRepository.list();
  const csv = buildTransactionsCsv(transactions);
  triggerBrowserDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    "clocket-transactions.csv",
  );
};
