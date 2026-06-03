import {
  TRANSACTION_EXPENSE_TEXT_CLASS,
  TRANSACTION_INCOME_TEXT_CLASS,
} from "@/constants";
import type {
  CreateTransactionInput,
  TransactionItem,
  TransactionsRepository,
  UpdateTransactionPatch,
} from "@/domain/transactions/repository";
import { TRANSACTIONS_CHANGED_EVENT } from "@/domain/transactions/repository";
import { toArsTransactionAmount } from "@/domain/currency/transactionCurrency";
import { ensureCoreBackendCleanStartCutover } from "./coreFinanceCleanStart";
import { coreFinanceHttpClient, isNotFoundError, withCoreFinanceErrors } from "./coreFinanceHttpClient";
import type { CategoryResponse } from "./categoriesRepository";

interface TransactionResponse {
  id: string;
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  goalId: string | null;
  installmentPlanId: string | null;
  transactionType: "regular" | "saving";
  name: string;
  amount: string;
  currency: "USD" | "ARS";
  date: string;
  notes: string | null;
  uiIcon: string | null;
  uiIconBg: string | null;
  cuotaInstallmentIndex: number | null;
  cuotaInstallmentsCount: number | null;
  createdAt: string;
  updatedAt: string;
}

interface TransactionListResponse {
  transactions: TransactionResponse[];
}

interface CategoryListResponse {
  categories: CategoryResponse[];
}

interface DeleteResponse {
  deleted: true;
}

interface CategoryLookup {
  categoryById: Map<string, CategoryResponse>;
  subcategoryById: Map<string, { category: CategoryResponse; name: string }>;
  subcategoryIdByCategoryAndName: Map<string, string>;
}

const parseSignedAmount = (value: unknown): number => {
  const normalized = String(value ?? "").replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatRawSignedAmount = (value: number): string => {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}`;
};

const normalizeLookupName = (value: string): string => value.trim().toLocaleLowerCase("es-ES");

const buildCategoryLookup = (categories: CategoryResponse[]): CategoryLookup => {
  const categoryById = new Map<string, CategoryResponse>();
  const subcategoryById = new Map<string, { category: CategoryResponse; name: string }>();
  const subcategoryIdByCategoryAndName = new Map<string, string>();

  categories.forEach((category) => {
    categoryById.set(category.id, category);
    category.subcategories.forEach((subcategory) => {
      subcategoryById.set(subcategory.id, { category, name: subcategory.name });
      subcategoryIdByCategoryAndName.set(
        `${category.id}:${normalizeLookupName(subcategory.name)}`,
        subcategory.id,
      );
    });
  });

  return { categoryById, subcategoryById, subcategoryIdByCategoryAndName };
};

const toOptional = <T>(value: T | null): T | undefined => value ?? undefined;

const buildMeta = (transaction: TransactionResponse): string => {
  const note = transaction.notes?.trim();
  return note ? `${transaction.date} • ${note}` : transaction.date;
};

const extractNotes = (meta: string | undefined): string | null | undefined => {
  if (meta === undefined) return undefined;
  const trimmed = meta.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(" • ");
  const first = parts[0]?.trim();
  if (first && /^\d{4}-\d{2}-\d{2}$/.test(first)) {
    const rest = parts.slice(1).join(" • ").trim();
    return rest || null;
  }
  return trimmed;
};

const dispatchTransactionsChanged = (): void => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
};

export class HttpTransactionsRepository implements TransactionsRepository {
  private categoryLookup: CategoryLookup | null = null;

  public constructor() {
    ensureCoreBackendCleanStartCutover();
  }

  public async list(): Promise<TransactionItem[]> {
    return withCoreFinanceErrors(async () => {
      const [transactionsResponse, lookup] = await Promise.all([
        coreFinanceHttpClient.get<TransactionListResponse>("/api/transactions"),
        this.getCategoryLookup(),
      ]);
      return transactionsResponse.data.transactions.map((transaction) => this.toTransactionItem(transaction, lookup));
    });
  }

  public async getById(id: string): Promise<TransactionItem | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        const [transactionResponse, lookup] = await Promise.all([
          coreFinanceHttpClient.get<TransactionResponse>(`/api/transactions/${id}`),
          this.getCategoryLookup(),
        ]);
        return this.toTransactionItem(transactionResponse.data, lookup);
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async create(input: CreateTransactionInput): Promise<TransactionItem> {
    return withCoreFinanceErrors(async () => {
      const lookup = await this.getCategoryLookup();
      const response = await coreFinanceHttpClient.post<TransactionResponse>(
        "/api/transactions",
        this.toCreatePayload(input, lookup),
      );
      const item = this.toTransactionItem(response.data, lookup);
      dispatchTransactionsChanged();
      return item;
    });
  }

  public async update(id: string, patch: UpdateTransactionPatch): Promise<TransactionItem | null> {
    try {
      return await withCoreFinanceErrors(async () => {
        const lookup = await this.getCategoryLookup();
        const response = await coreFinanceHttpClient.patch<TransactionResponse>(
          `/api/transactions/${id}`,
          this.toUpdatePayload(patch, lookup),
        );
        const item = this.toTransactionItem(response.data, lookup);
        dispatchTransactionsChanged();
        return item;
      });
    } catch (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }
  }

  public async remove(id: string): Promise<boolean> {
    try {
      const removed = await withCoreFinanceErrors(async () => {
        const response = await coreFinanceHttpClient.delete<DeleteResponse>(`/api/transactions/${id}`);
        return response.data.deleted === true;
      });
      if (removed) dispatchTransactionsChanged();
      return removed;
    } catch (error) {
      if (isNotFoundError(error)) return false;
      throw error;
    }
  }

  public async clearAll(): Promise<void> {
    const transactions = await this.list();
    await Promise.all(transactions.map((transaction) => this.remove(transaction.id)));
    dispatchTransactionsChanged();
  }

  private async getCategoryLookup(): Promise<CategoryLookup> {
    if (this.categoryLookup) {
      return this.categoryLookup;
    }

    const response = await coreFinanceHttpClient.get<CategoryListResponse>("/api/categories");
    this.categoryLookup = buildCategoryLookup(response.data.categories);
    return this.categoryLookup;
  }

  private resolveSubcategoryId(
    categoryId: string | undefined,
    subcategoryName: string | undefined,
    lookup: CategoryLookup,
  ): string | null | undefined {
    if (subcategoryName === undefined) return undefined;
    const normalized = normalizeLookupName(subcategoryName);
    if (!normalized) return null;
    if (!categoryId) return null;
    return lookup.subcategoryIdByCategoryAndName.get(`${categoryId}:${normalized}`) ?? null;
  }

  private toTransactionItem(transaction: TransactionResponse, lookup: CategoryLookup): TransactionItem {
    const category = transaction.categoryId ? lookup.categoryById.get(transaction.categoryId) : undefined;
    const subcategory = transaction.subcategoryId ? lookup.subcategoryById.get(transaction.subcategoryId) : undefined;
    const amount = toArsTransactionAmount(Number(transaction.amount), transaction.currency);
    const isIncome = amount > 0;

    return {
      id: transaction.id,
      accountId: transaction.accountId,
      transactionType: transaction.transactionType,
      goalId: toOptional(transaction.goalId),
      categoryId: toOptional(transaction.categoryId),
      subcategoryName: subcategory?.name,
      cuotaPlanId: toOptional(transaction.installmentPlanId),
      cuotaInstallmentIndex: toOptional(transaction.cuotaInstallmentIndex),
      cuotaInstallmentsCount: toOptional(transaction.cuotaInstallmentsCount),
      date: transaction.date,
      createdAt: transaction.createdAt,
      icon: transaction.uiIcon ?? category?.icon ?? (isIncome ? "arrow-up-right" : "receipt"),
      iconBg: transaction.uiIconBg ?? category?.iconBg ?? (isIncome ? "bg-[#16A34A]" : "bg-[#18181B]"),
      name: transaction.name,
      category: category?.name ?? "Sin categoría",
      amount: formatRawSignedAmount(amount),
      amountColor: isIncome ? TRANSACTION_INCOME_TEXT_CLASS : TRANSACTION_EXPENSE_TEXT_CLASS,
      meta: buildMeta(transaction),
    };
  }

  private toCreatePayload(input: CreateTransactionInput, lookup: CategoryLookup): Record<string, unknown> {
    return {
      accountId: input.accountId,
      categoryId: input.categoryId ?? null,
      subcategoryId: this.resolveSubcategoryId(input.categoryId, input.subcategoryName, lookup) ?? null,
      goalId: input.goalId ?? null,
      installmentPlanId: input.cuotaPlanId ?? null,
      transactionType: input.transactionType ?? "regular",
      name: input.name,
      amount: parseSignedAmount(input.amount),
      currency: "ARS",
      date: input.date,
      notes: extractNotes(input.meta) ?? null,
      uiIcon: input.icon,
      uiIconBg: input.iconBg,
      cuotaInstallmentIndex: input.cuotaInstallmentIndex ?? null,
      cuotaInstallmentsCount: input.cuotaInstallmentsCount ?? null,
    };
  }

  private toUpdatePayload(patch: UpdateTransactionPatch, lookup: CategoryLookup): Record<string, unknown> {
    return {
      ...(patch.accountId !== undefined ? { accountId: patch.accountId } : {}),
      ...(patch.categoryId !== undefined ? { categoryId: patch.categoryId ?? null } : {}),
      ...(patch.subcategoryName !== undefined
        ? { subcategoryId: this.resolveSubcategoryId(patch.categoryId, patch.subcategoryName, lookup) }
        : {}),
      ...(patch.goalId !== undefined ? { goalId: patch.goalId ?? null } : {}),
      ...(patch.cuotaPlanId !== undefined ? { installmentPlanId: patch.cuotaPlanId ?? null } : {}),
      ...(patch.transactionType !== undefined ? { transactionType: patch.transactionType } : {}),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.amount !== undefined ? { amount: parseSignedAmount(patch.amount), currency: "ARS" } : {}),
      ...(patch.date !== undefined ? { date: patch.date } : {}),
      ...(patch.meta !== undefined ? { notes: extractNotes(patch.meta) } : {}),
      ...(patch.icon !== undefined ? { uiIcon: patch.icon } : {}),
      ...(patch.iconBg !== undefined ? { uiIconBg: patch.iconBg } : {}),
      ...(patch.cuotaInstallmentIndex !== undefined
        ? { cuotaInstallmentIndex: patch.cuotaInstallmentIndex ?? null }
        : {}),
      ...(patch.cuotaInstallmentsCount !== undefined
        ? { cuotaInstallmentsCount: patch.cuotaInstallmentsCount ?? null }
        : {}),
    };
  }
}

export const httpTransactionsRepository: TransactionsRepository = new HttpTransactionsRepository();
