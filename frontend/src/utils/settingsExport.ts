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
import type { AppSettingsItem, AppSettingsRepository } from "@/domain/app-settings/repository";
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

export const SETTINGS_EXPORT_CONTRACT_VERSION = 1 as const;

export const SETTINGS_EXPORT_REQUIRED_DOMAINS = [
  "settings",
  "accounts",
  "categories",
  "budgets",
  "goals",
  "cuotas",
  "transactions",
  "investmentPositions",
  "investmentRefs",
] as const;

export type SettingsExportDomain = typeof SETTINGS_EXPORT_REQUIRED_DOMAINS[number];

export interface SettingsExportCounts {
  settings: number;
  accounts: number;
  categories: number;
  budgets: number;
  goals: number;
  cuotas: number;
  transactions: number;
  investmentPositions: number;
  investmentRefs: number;
}

export interface SettingsExportManifest {
  name: "clocket-settings-export";
  requiredDomains: readonly SettingsExportDomain[];
  includedDomains: readonly SettingsExportDomain[];
}

export interface SettingsExportIntegrity {
  algorithm: "SHA-256" | "FALLBACK-DJB2";
  checksum: string;
}

export interface SettingsExportScope {
  importRestore: "out_of_scope";
  localStorageImport: "out_of_scope";
  auth: "out_of_scope";
  userOwnership: "out_of_scope";
}

export interface SettingsExportSnapshot {
  complete: true;
  exportedAt: string;
  version: typeof SETTINGS_EXPORT_CONTRACT_VERSION;
  manifest: SettingsExportManifest;
  counts: SettingsExportCounts;
  integrity: SettingsExportIntegrity;
  scope: SettingsExportScope;
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

type SettingsExportSnapshotWithoutIntegrity = Omit<SettingsExportSnapshot, "integrity">;

export class SettingsExportError extends Error {
  public readonly code = "SETTINGS_EXPORT_DOMAIN_READ_FAILED";

  public constructor(
    public readonly domain: SettingsExportDomain,
    public readonly cause: unknown,
  ) {
    super(`Failed to read required export domain: ${domain}`);
    this.name = "SettingsExportError";
  }
}

const SETTINGS_EXPORT_DOMAIN_LABELS: Record<SettingsExportDomain, string> = {
  settings: "Configuración",
  accounts: "Cuentas",
  categories: "Categorías",
  budgets: "Presupuestos",
  goals: "Metas",
  cuotas: "Cuotas",
  transactions: "Transacciones",
  investmentPositions: "Inversiones",
  investmentRefs: "Referencias de inversiones",
};

export const formatSettingsExportErrorMessage = (error: unknown): string => {
  if (error instanceof SettingsExportError) {
    const domainLabel = SETTINGS_EXPORT_DOMAIN_LABELS[error.domain];
    return `No pudimos leer ${domainLabel} para generar el backup. No se descargó ningún archivo; intenta nuevamente.`;
  }

  return "No pudimos generar el backup JSON. No se descargó ningún archivo; intenta nuevamente.";
};

type LegacySettingsSecurity = AppSettingsItem["security"] & {
  pinHash?: unknown;
};

export const redactSettingsForExport = (settings: AppSettingsItem): AppSettingsItem => {
  const security = settings.security as LegacySettingsSecurity;
  const hasPin = typeof security.hasPin === "boolean"
    ? security.hasPin
    : typeof security.pinHash === "string" && security.pinHash.length > 0;

  return {
    ...settings,
    security: { hasPin },
  };
};

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

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === "object"
  && value !== null
  && !Array.isArray(value)
);

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
};

const toHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let hex = "";

  for (const value of bytes) {
    hex += value.toString(16).padStart(2, "0");
  }

  return hex;
};

const fallbackDigest = (payload: string): string => {
  let hash = 5381;

  for (let index = 0; index < payload.length; index += 1) {
    hash = ((hash << 5) + hash) ^ payload.charCodeAt(index);
  }

  return `fallback-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

const buildIntegrity = async (snapshot: SettingsExportSnapshotWithoutIntegrity): Promise<SettingsExportIntegrity> => {
  const payload = stableStringify(snapshot);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return { algorithm: "SHA-256", checksum: toHex(digest) };
  }

  return { algorithm: "FALLBACK-DJB2", checksum: fallbackDigest(payload) };
};

const readRequiredDomain = async <T>(
  domain: SettingsExportDomain,
  read: () => Promise<T>,
): Promise<T> => {
  try {
    return await read();
  } catch (error) {
    throw new SettingsExportError(domain, error);
  }
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

  const [settings, accounts, categories, budgets, goals, cuotas, transactions, positions, refs] = await Promise.all([
    readRequiredDomain("settings", () => appSettingsRepository.get()),
    readRequiredDomain("accounts", () => accountsRepository.list()),
    readRequiredDomain("categories", () => categoriesRepository.list()),
    readRequiredDomain("budgets", () => budgetsRepository.list()),
    readRequiredDomain("goals", () => goalsRepository.list()),
    readRequiredDomain("cuotas", () => cuotasRepository.list()),
    readRequiredDomain("transactions", () => transactionsRepository.list()),
    readRequiredDomain("investmentPositions", () => investmentsRepository.listPositions()),
    readRequiredDomain("investmentRefs", () => investmentsRepository.getRefsMap()),
  ]);

  const redactedSettings = redactSettingsForExport(settings);

  const snapshotWithoutIntegrity: SettingsExportSnapshotWithoutIntegrity = {
    complete: true,
    exportedAt: new Date().toISOString(),
    version: SETTINGS_EXPORT_CONTRACT_VERSION,
    manifest: {
      name: "clocket-settings-export",
      requiredDomains: SETTINGS_EXPORT_REQUIRED_DOMAINS,
      includedDomains: SETTINGS_EXPORT_REQUIRED_DOMAINS,
    },
    counts: {
      settings: 1,
      accounts: accounts.length,
      categories: categories.length,
      budgets: budgets.length,
      goals: goals.length,
      cuotas: cuotas.length,
      transactions: transactions.length,
      investmentPositions: positions.length,
      investmentRefs: Object.keys(refs).length,
    },
    scope: {
      importRestore: "out_of_scope",
      localStorageImport: "out_of_scope",
      auth: "out_of_scope",
      userOwnership: "out_of_scope",
    },
    data: {
      settings: redactedSettings,
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

  return {
    ...snapshotWithoutIntegrity,
    integrity: await buildIntegrity(snapshotWithoutIntegrity),
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
