import type {
  CreateCuotaInput,
  CuotaPlanItem,
  CuotasRepository,
  UpdateCuotaPatch,
} from "./cuotasRepository";
import {
  getFulfilledInstallmentsByDate,
  getInstallmentDateParts,
  getInstallmentDateString,
  getTodayDatePartsLocal,
  isFutureDateParts,
  parseDateParts,
  type DateParts,
} from "./cuotasDateUtils";
import type { AccountItem } from "./accountsRepository";
import type { CategoryItem } from "./categoriesRepository";
import type { CreateTransactionInput, TransactionItem } from "./transactionsRepository";
import { accountsRepository } from "./localStorageAccountsRepository";
import { categoriesRepository } from "./localStorageCategoriesRepository";
import { transactionsRepository } from "./localStorageTransactionsRepository";

const STORAGE_VERSION = 1 as const;
const DEFAULT_STORAGE_KEY = "clocket.cuotas";
const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const CREDIT_CARD_CATEGORY_NAME = "Tarjeta de Credito";
const CREDIT_CARD_CATEGORY_ICON = "credit-card";
const CREDIT_CARD_CATEGORY_ICON_BG = "bg-[#18181B]";
const CREDIT_CARD_ACCOUNT_NAME = "Tarjeta de Credito";
const CREDIT_CARD_TRANSACTION_ICON = "credit-card";
const CREDIT_CARD_TRANSACTION_ICON_BG = "bg-[#18181B]";
const CREDIT_CARD_TRANSACTION_AMOUNT_COLOR = "text-[#DC2626]";

interface CuotasStorageV1 {
  version: typeof STORAGE_VERSION;
  items: CuotaPlanItem[];
}

const buildInitialState = (): CuotasStorageV1 => ({
  version: STORAGE_VERSION,
  items: [],
});

const toYearMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const toCurrencyNumber = (value: number): number => {
  return Math.round(value * 100) / 100;
};

const normalizeTitle = (value?: string): string => {
  const title = value?.trim();
  return title && title.length > 0 ? title : "Nueva cuota";
};

const normalizeDescription = (value?: string): string | undefined => {
  const description = value?.trim();
  return description && description.length > 0 ? description : undefined;
};

const normalizeCategoryId = (value?: string): string | undefined => {
  const categoryId = value?.trim();
  return categoryId && categoryId.length > 0 ? categoryId : undefined;
};

const normalizeSubcategoryName = (value?: string): string | undefined => {
  const subcategoryName = value?.trim();
  return subcategoryName && subcategoryName.length > 0 ? subcategoryName : undefined;
};

const normalizeInstallmentsCount = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Installments count must be a valid number.");
  }

  const normalized = Math.floor(value);
  if (normalized < 1) {
    throw new Error("Installments count must be at least 1.");
  }

  return normalized;
};

const normalizeTotalAmount = (value: number): number => {
  if (!Number.isFinite(value)) {
    throw new Error("Total amount must be a valid number.");
  }

  if (value <= 0) {
    throw new Error("Total amount must be greater than 0.");
  }

  return toCurrencyNumber(value);
};

const normalizePaidInstallmentsCount = (
  value: number | undefined,
  installmentsCount: number,
): number => {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    throw new Error("Paid installments count must be a valid number.");
  }

  const normalized = Math.max(0, Math.floor(value));
  return Math.min(normalized, installmentsCount);
};

const clampPaidInstallmentsCountToCurrentDate = (
  paidInstallmentsCount: number,
  installmentsCount: number,
  createdAt: string,
): number => {
  const fulfilledInstallments = getFulfilledInstallmentsByDate(createdAt);
  return Math.min(paidInstallmentsCount, installmentsCount, fulfilledInstallments);
};

const normalizeStartMonth = (value?: string): string => {
  const raw = value?.trim();
  if (!raw) {
    return toYearMonth(new Date());
  }

  const match = YEAR_MONTH_PATTERN.exec(raw);
  if (!match) {
    throw new Error("Start month must use YYYY-MM format.");
  }

  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error("Start month must use YYYY-MM format.");
  }

  return raw;
};

const assertNotFutureDateParts = (parts: DateParts): void => {
  if (isFutureDateParts(parts, getTodayDatePartsLocal())) {
    throw new Error("Created date cannot be in the future.");
  }
};

const normalizeCreatedAt = (value?: string): string => {
  const raw = value?.trim();
  if (!raw) {
    return new Date().toISOString();
  }

  const dateParts = parseDateParts(raw);
  if (dateParts) {
    assertNotFutureDateParts(dateParts);

    const year = dateParts.year;
    const month = dateParts.month;
    const day = dateParts.day;
    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);
    return localDate.toISOString();
  }

  const dateCandidate = new Date(raw);
  if (Number.isNaN(dateCandidate.getTime())) {
    throw new Error("Created date must be a valid date.");
  }
  assertNotFutureDateParts({
    year: dateCandidate.getFullYear(),
    month: dateCandidate.getMonth() + 1,
    day: dateCandidate.getDate(),
  });

  return dateCandidate.toISOString();
};

const calculateInstallmentAmount = (
  totalAmount: number,
  installmentsCount: number,
): number => {
  return toCurrencyNumber(totalAmount / installmentsCount);
};

const createCuotaId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `cuota_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
};

const normalizeSubcategoryList = (values: string[] | undefined): string[] => {
  if (!values) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );
};

const isFinishedPlan = (plan: CuotaPlanItem): boolean => {
  return plan.paidInstallmentsCount >= plan.installmentsCount;
};

const formatInstallmentAmount = (value: number): string => {
  return value.toFixed(2);
};

const buildInstallmentTransactionInput = (
  plan: CuotaPlanItem,
  accountId: string,
  installmentIndex: number,
): CreateTransactionInput => {
  const date = getInstallmentDateString(plan.createdAt, installmentIndex) ??
    new Date().toISOString().slice(0, 10);

  return {
    icon: CREDIT_CARD_TRANSACTION_ICON,
    iconBg: CREDIT_CARD_TRANSACTION_ICON_BG,
    name: plan.title,
    accountId,
    category: CREDIT_CARD_CATEGORY_NAME,
    categoryId: plan.categoryId,
    subcategoryName: plan.subcategoryName,
    cuotaPlanId: plan.id,
    cuotaInstallmentIndex: installmentIndex,
    cuotaInstallmentsCount: plan.installmentsCount,
    date,
    createdAt: new Date(`${date}T12:00:00`).toISOString(),
    amount: `-$${formatInstallmentAmount(plan.installmentAmount)}`,
    amountColor: CREDIT_CARD_TRANSACTION_AMOUNT_COLOR,
    meta: `Cuota ${installmentIndex}/${plan.installmentsCount}`,
  };
};

const findCreditCardCategory = (categories: CategoryItem[]): CategoryItem | null => {
  return categories.find((category) => (
    category.name.trim().toLocaleLowerCase("es-ES") ===
      CREDIT_CARD_CATEGORY_NAME.toLocaleLowerCase("es-ES")
  )) ?? null;
};

const ensureCreditCardCategory = async (): Promise<CategoryItem> => {
  const categories = await categoriesRepository.list();
  const existing = findCreditCardCategory(categories);
  if (existing) {
    return existing;
  }

  const created = await categoriesRepository.create({
    name: CREDIT_CARD_CATEGORY_NAME,
    icon: CREDIT_CARD_CATEGORY_ICON,
    iconBg: CREDIT_CARD_CATEGORY_ICON_BG,
  });

  return created;
};

const findCreditCardAccount = (accounts: AccountItem[]): AccountItem | null => {
  return accounts.find((account) => (
    account.name.trim().toLocaleLowerCase("es-ES") ===
      CREDIT_CARD_ACCOUNT_NAME.toLocaleLowerCase("es-ES")
  )) ?? null;
};

const ensureCreditCardAccount = async (): Promise<AccountItem> => {
  const accounts = await accountsRepository.list();
  const existing = findCreditCardAccount(accounts);
  if (existing) {
    return existing;
  }

  const created = await accountsRepository.create({
    name: CREDIT_CARD_ACCOUNT_NAME,
    balance: 0,
  });

  return created;
};

const ensurePlanSubcategory = async (
  categoryId: string | undefined,
  subcategoryName: string | undefined,
): Promise<void> => {
  if (!categoryId || !subcategoryName) {
    return;
  }

  const category = await categoriesRepository.getById(categoryId);
  if (!category) {
    return;
  }

  const currentSubcategories = normalizeSubcategoryList(category.subcategories);
  if (currentSubcategories.includes(subcategoryName)) {
    return;
  }

  const nextSubcategories = [...currentSubcategories, subcategoryName];
  await categoriesRepository.update(category.id, {
    subcategories: nextSubcategories,
    subcategoryCount: nextSubcategories.length,
  });
};

const removePlanSubcategoryIfUnused = async (
  categoryId: string | undefined,
  subcategoryName: string | undefined,
  allPlans: CuotaPlanItem[],
  targetPlanId: string,
): Promise<void> => {
  if (!categoryId || !subcategoryName) {
    return;
  }

  const hasAnotherActivePlanWithSameSubcategory = allPlans.some((plan) => (
    plan.id !== targetPlanId &&
    plan.categoryId === categoryId &&
    plan.subcategoryName === subcategoryName &&
    !isFinishedPlan(plan)
  ));

  if (hasAnotherActivePlanWithSameSubcategory) {
    return;
  }

  const category = await categoriesRepository.getById(categoryId);
  if (!category) {
    return;
  }

  const currentSubcategories = normalizeSubcategoryList(category.subcategories);
  if (!currentSubcategories.includes(subcategoryName)) {
    return;
  }

  const nextSubcategories = currentSubcategories.filter((value) => value !== subcategoryName);
  await categoriesRepository.update(category.id, {
    subcategories: nextSubcategories,
    subcategoryCount: nextSubcategories.length,
  });
};

const ensureInstallmentTransactions = async (plan: CuotaPlanItem): Promise<void> => {
  const targetInstallments = Math.min(plan.paidInstallmentsCount, plan.installmentsCount);
  if (targetInstallments <= 0) {
    return;
  }

  const creditCardAccount = await ensureCreditCardAccount();
  const todayDateParts = getTodayDatePartsLocal();
  const transactions = await transactionsRepository.list();
  const existingInstallmentsByIndex = new Map<number, TransactionItem>();

  transactions.forEach((transaction: TransactionItem) => {
    if (
      transaction.cuotaPlanId === plan.id &&
      Number.isFinite(transaction.cuotaInstallmentIndex)
    ) {
      existingInstallmentsByIndex.set(
        transaction.cuotaInstallmentIndex as number,
        transaction,
      );
    }
  });

  for (let installmentIndex = 1; installmentIndex <= targetInstallments; installmentIndex += 1) {
    const candidateDateParts = getInstallmentDateParts(plan.createdAt, installmentIndex);
    if (!candidateDateParts || isFutureDateParts(candidateDateParts, todayDateParts)) {
      continue;
    }

    const existingInstallmentTransaction = existingInstallmentsByIndex.get(installmentIndex);
    if (existingInstallmentTransaction) {
      if (existingInstallmentTransaction.accountId !== creditCardAccount.id) {
        await transactionsRepository.update(existingInstallmentTransaction.id, {
          accountId: creditCardAccount.id,
        });
      }
      continue;
    }

    await transactionsRepository.create(
      buildInstallmentTransactionInput(plan, creditCardAccount.id, installmentIndex),
    );
  }
};

const removeInstallmentTransactionsByPlanId = async (planId: string): Promise<void> => {
  if (!planId) {
    return;
  }

  const transactions = await transactionsRepository.list();
  const planTransactions = transactions.filter((transaction) => transaction.cuotaPlanId === planId);

  for (const transaction of planTransactions) {
    await transactionsRepository.remove(transaction.id);
  }
};

const normalizeForCreate = (input: CreateCuotaInput): CuotaPlanItem => {
  const totalAmount = normalizeTotalAmount(input.totalAmount);
  const installmentsCount = normalizeInstallmentsCount(input.installmentsCount);
  const normalizedPaidInstallmentsCount = normalizePaidInstallmentsCount(
    input.paidInstallmentsCount,
    installmentsCount,
  );
  const createdAt = normalizeCreatedAt(input.createdAt);
  const paidInstallmentsCount = clampPaidInstallmentsCountToCurrentDate(
    normalizedPaidInstallmentsCount,
    installmentsCount,
    createdAt,
  );
  const title = normalizeTitle(input.title);

  return {
    id: createCuotaId(),
    title,
    description: normalizeDescription(input.description),
    totalAmount,
    installmentsCount,
    installmentAmount: calculateInstallmentAmount(totalAmount, installmentsCount),
    startMonth: normalizeStartMonth(input.startMonth),
    paidInstallmentsCount,
    categoryId: normalizeCategoryId(input.categoryId),
    subcategoryName: normalizeSubcategoryName(input.subcategoryName) ?? title,
    createdAt,
    updatedAt: createdAt,
  };
};

const normalizeForUpdate = (
  current: CuotaPlanItem,
  patch: UpdateCuotaPatch,
): CuotaPlanItem => {
  const totalAmount =
    patch.totalAmount === undefined
      ? current.totalAmount
      : normalizeTotalAmount(patch.totalAmount);
  const installmentsCount =
    patch.installmentsCount === undefined
      ? current.installmentsCount
      : normalizeInstallmentsCount(patch.installmentsCount);
  const normalizedPaidInstallmentsCount =
    patch.paidInstallmentsCount === undefined
      ? Math.min(current.paidInstallmentsCount, installmentsCount)
      : normalizePaidInstallmentsCount(patch.paidInstallmentsCount, installmentsCount);
  const paidInstallmentsCount = clampPaidInstallmentsCountToCurrentDate(
    normalizedPaidInstallmentsCount,
    installmentsCount,
    current.createdAt,
  );

  return {
    ...current,
    ...(patch.title !== undefined ? { title: normalizeTitle(patch.title) } : {}),
    ...(patch.description !== undefined
      ? { description: normalizeDescription(patch.description) }
      : {}),
    ...(patch.categoryId !== undefined
      ? { categoryId: normalizeCategoryId(patch.categoryId) }
      : {}),
    ...(patch.subcategoryName !== undefined
      ? { subcategoryName: normalizeSubcategoryName(patch.subcategoryName) }
      : {}),
    ...(patch.startMonth !== undefined
      ? { startMonth: normalizeStartMonth(patch.startMonth) }
      : {}),
    totalAmount,
    installmentsCount,
    paidInstallmentsCount,
    installmentAmount: calculateInstallmentAmount(totalAmount, installmentsCount),
    updatedAt: new Date().toISOString(),
  };
};

const cloneCuota = (item: CuotaPlanItem): CuotaPlanItem => ({ ...item });
const cloneCuotas = (items: CuotaPlanItem[]): CuotaPlanItem[] => items.map(cloneCuota);

const isCuotaPlanItem = (value: unknown): value is CuotaPlanItem => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<CuotaPlanItem>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    (item.description === undefined || typeof item.description === "string") &&
    typeof item.totalAmount === "number" &&
    Number.isFinite(item.totalAmount) &&
    typeof item.installmentsCount === "number" &&
    Number.isFinite(item.installmentsCount) &&
    typeof item.installmentAmount === "number" &&
    Number.isFinite(item.installmentAmount) &&
    typeof item.startMonth === "string" &&
    YEAR_MONTH_PATTERN.test(item.startMonth) &&
    typeof item.paidInstallmentsCount === "number" &&
    Number.isFinite(item.paidInstallmentsCount) &&
    (item.categoryId === undefined || typeof item.categoryId === "string") &&
    (item.subcategoryName === undefined || typeof item.subcategoryName === "string") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
};

const isStorageShape = (value: unknown): value is CuotasStorageV1 => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Partial<CuotasStorageV1>;
  return (
    state.version === STORAGE_VERSION &&
    Array.isArray(state.items) &&
    state.items.every(isCuotaPlanItem)
  );
};

export class LocalStorageCuotasRepository implements CuotasRepository {
  private readonly storageKey: string;

  private memoryState: CuotasStorageV1;

  public constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
    this.memoryState = buildInitialState();
  }

  public async list(): Promise<CuotaPlanItem[]> {
    return cloneCuotas(this.readState().items);
  }

  public async getById(id: string): Promise<CuotaPlanItem | null> {
    const found = this.readState().items.find((item) => item.id === id);
    return found ? cloneCuota(found) : null;
  }

  public async create(input: CreateCuotaInput): Promise<CuotaPlanItem> {
    const state = this.readState();
    const created = normalizeForCreate(input);
    const creditCardCategory = await ensureCreditCardCategory();

    const nextPlan: CuotaPlanItem = {
      ...created,
      categoryId: creditCardCategory.id,
      subcategoryName: created.subcategoryName ?? created.title,
    };

    state.items.push(nextPlan);
    this.writeState(state);

    if (!isFinishedPlan(nextPlan)) {
      await ensurePlanSubcategory(nextPlan.categoryId, nextPlan.subcategoryName);
    }

    await ensureInstallmentTransactions(nextPlan);

    if (isFinishedPlan(nextPlan)) {
      await removePlanSubcategoryIfUnused(
        nextPlan.categoryId,
        nextPlan.subcategoryName,
        state.items,
        nextPlan.id,
      );
    }

    return cloneCuota(nextPlan);
  }

  public async update(id: string, patch: UpdateCuotaPatch): Promise<CuotaPlanItem | null> {
    const state = this.readState();
    const index = state.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const current = state.items[index];
    const updatedBase = normalizeForUpdate(current, patch);
    const creditCardCategory = await ensureCreditCardCategory();

    const updated: CuotaPlanItem = {
      ...updatedBase,
      categoryId: creditCardCategory.id,
      subcategoryName: updatedBase.subcategoryName ?? updatedBase.title,
    };

    state.items[index] = updated;
    this.writeState(state);

    if (!isFinishedPlan(updated)) {
      await ensurePlanSubcategory(updated.categoryId, updated.subcategoryName);
    }

    await ensureInstallmentTransactions(updated);

    if (isFinishedPlan(updated)) {
      await removePlanSubcategoryIfUnused(
        updated.categoryId,
        updated.subcategoryName,
        state.items,
        updated.id,
      );
    }

    return cloneCuota(updated);
  }

  public async remove(id: string): Promise<boolean> {
    const state = this.readState();
    const removedPlan = state.items.find((item) => item.id === id);
    const filtered = state.items.filter((item) => item.id !== id);

    if (filtered.length === state.items.length) {
      return false;
    }

    await removeInstallmentTransactionsByPlanId(id);

    state.items = filtered;
    this.writeState(state);

    await removePlanSubcategoryIfUnused(
      removedPlan?.categoryId,
      removedPlan?.subcategoryName,
      state.items,
      removedPlan?.id ?? id,
    );

    return true;
  }

  public async clearAll(): Promise<void> {
    const currentItems = this.readState().items;
    for (const item of currentItems) {
      await removeInstallmentTransactionsByPlanId(item.id);
    }

    this.writeState(buildInitialState());
  }

  private getStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  }

  private readState(): CuotasStorageV1 {
    const storage = this.getStorage();

    if (!storage) {
      return {
        version: this.memoryState.version,
        items: cloneCuotas(this.memoryState.items),
      };
    }

    const raw = storage.getItem(this.storageKey);
    if (!raw) {
      const initial = buildInitialState();
      this.writeState(initial);
      return initial;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (isStorageShape(parsed)) {
        return {
          version: parsed.version,
          items: cloneCuotas(parsed.items),
        };
      }
    } catch {
      // Invalid storage payload is reset to keep behavior predictable.
    }

    const reset = buildInitialState();
    this.writeState(reset);
    return reset;
  }

  private writeState(state: CuotasStorageV1): void {
    const next: CuotasStorageV1 = {
      version: state.version,
      items: cloneCuotas(state.items),
    };

    this.memoryState = next;

    const storage = this.getStorage();
    if (!storage) {
      return;
    }

    storage.setItem(this.storageKey, JSON.stringify(next));
  }
}

export const cuotasRepository: CuotasRepository = new LocalStorageCuotasRepository();
