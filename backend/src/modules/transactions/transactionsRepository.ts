import {
  Prisma,
  type CurrencyCode,
  type PrismaClient,
  type TransactionType as PrismaTransactionType,
} from "../../generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export type TransactionRecordType = "regular" | "saving";

export type TransactionRepositoryErrorCode =
  | "MISSING_ACCOUNT"
  | "MISSING_CATEGORY"
  | "MISSING_SUBCATEGORY"
  | "SUBCATEGORY_CATEGORY_MISMATCH"
  | "MISSING_GOAL"
  | "SAVING_REQUIRES_GOAL"
  | "INVALID_AMOUNT_SIGN"
  | "CATEGORY_NOT_ELIGIBLE_FOR_CLASSIFICATION"
  | "MISSING_INSTALLMENT_PLAN";

export class TransactionRepositoryError extends Error {
  public readonly code: TransactionRepositoryErrorCode;

  public constructor(code: TransactionRepositoryErrorCode, message: string) {
    super(message);
    this.name = "TransactionRepositoryError";
    this.code = code;
  }
}

export interface TransactionRecord {
  id: string;
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  goalId: string | null;
  installmentPlanId: string | null;
  transactionType: TransactionRecordType;
  classification?: "income" | "expense" | "saving";
  name: string;
  amount: string;
  currency: CurrencyCode;
  date: string;
  notes: string | null;
  uiIcon: string | null;
  uiIconBg: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  cuotaInstallmentIndex: number | null;
  cuotaInstallmentsCount: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TransactionListFilters {
  accountId?: string;
  categoryId?: string;
  subcategoryId?: string;
  goalId?: string;
  installmentPlanId?: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
}

export interface CreateTransactionInput {
  accountId: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  goalId?: string | null;
  installmentPlanId?: string | null;
  transactionType?: TransactionRecordType;
  name: string;
  amount: DecimalInput;
  currency?: CurrencyCode;
  date: string | Date;
  notes?: string | null;
  uiIcon?: string | null;
  uiIconBg?: string | null;
  cuotaInstallmentIndex?: number | null;
  cuotaInstallmentsCount?: number | null;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface TransactionsRepository {
  listActive: (filters?: TransactionListFilters) => Promise<TransactionRecord[]>;
  getById: (id: string) => Promise<TransactionRecord | null>;
  create: (input: CreateTransactionInput) => Promise<TransactionRecord>;
  update: (id: string, input: UpdateTransactionInput) => Promise<TransactionRecord | null>;
  softDelete: (id: string) => Promise<boolean>;
}

const transactionInclude = {
  category: true,
  subcategory: true,
} satisfies Prisma.TransactionInclude;

type TransactionModel = Prisma.TransactionGetPayload<{ include: typeof transactionInclude }>;

type ReferenceCandidate = {
  accountId: string;
  categoryId: string | null;
  subcategoryId: string | null;
  goalId: string | null;
  installmentPlanId: string | null;
  transactionType: TransactionRecordType;
  amount: Prisma.Decimal;
};

const TRANSACTION_TYPE_TO_PRISMA: Record<TransactionRecordType, PrismaTransactionType> = {
  regular: "REGULAR",
  saving: "SAVING",
};

const TRANSACTION_TYPE_FROM_PRISMA: Record<PrismaTransactionType, TransactionRecordType> = {
  REGULAR: "regular",
  SAVING: "saving",
};

const toDecimal = (value: DecimalInput): Prisma.Decimal => new Prisma.Decimal(value);

const classifyTransaction = (
  amount: Prisma.Decimal,
  transactionType: TransactionRecordType,
): "income" | "expense" | "saving" => {
  if (transactionType === "saving") return "saving";
  if (amount.gt(0)) return "income";
  if (amount.lt(0)) return "expense";
  throw new TransactionRepositoryError("INVALID_AMOUNT_SIGN", "Transaction amount must be different from zero.");
};

const toIso = (value: Date): string => value.toISOString();

const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

const toDbDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
    ));
  }

  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
};

const trimNullable = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toTransactionRecord = (transaction: TransactionModel): TransactionRecord => ({
  id: transaction.id,
  accountId: transaction.accountId,
  categoryId: transaction.categoryId,
  subcategoryId: transaction.subcategoryId,
  goalId: transaction.goalId,
  installmentPlanId: transaction.installmentPlanId,
  transactionType: TRANSACTION_TYPE_FROM_PRISMA[transaction.transactionType],
  classification: classifyTransaction(transaction.amount, TRANSACTION_TYPE_FROM_PRISMA[transaction.transactionType]),
  name: transaction.name,
  amount: transaction.amount.toFixed(2),
  currency: transaction.currency,
  date: toDateOnly(transaction.date),
  notes: transaction.notes,
  uiIcon: transaction.category?.icon ?? transaction.uiIcon,
  uiIconBg: transaction.category?.iconBg ?? transaction.uiIconBg,
  categoryName: transaction.category?.name ?? null,
  subcategoryName: transaction.subcategory?.name ?? null,
  cuotaInstallmentIndex: transaction.cuotaInstallmentIndex,
  cuotaInstallmentsCount: transaction.cuotaInstallmentsCount,
  createdAt: toIso(transaction.createdAt),
  updatedAt: toIso(transaction.updatedAt),
  deletedAt: transaction.deletedAt ? toIso(transaction.deletedAt) : null,
});

const assertActiveAccount = async (prisma: PrismaClient, accountId: string): Promise<void> => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!account) {
    throw new TransactionRepositoryError(
      "MISSING_ACCOUNT",
      `Active account '${accountId}' was not found.`,
    );
  }
};

const assertActiveCategory = async (
  prisma: PrismaClient,
  categoryId: string | null,
): Promise<{ id: string; incomeEligible: boolean; expenseEligible: boolean; savingEligible: boolean }> => {
  if (!categoryId) {
    throw new TransactionRepositoryError(
      "MISSING_CATEGORY",
      "Transactions require an active category reference.",
    );
  }

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
    },
    select: { id: true, incomeEligible: true, expenseEligible: true, savingEligible: true },
  });

  if (!category) {
    throw new TransactionRepositoryError(
      "MISSING_CATEGORY",
      `Active category '${categoryId}' was not found.`,
    );
  }

  return category;
};

const resolveCategoryReferences = async (
  prisma: PrismaClient,
  categoryId: string | null,
  subcategoryId: string | null,
): Promise<{ categoryId: string | null; subcategoryId: string | null }> => {
  if (!subcategoryId) {
    if (categoryId) {
      await assertActiveCategory(prisma, categoryId);
    }

    return { categoryId, subcategoryId: null };
  }

  const subcategory = await prisma.subcategory.findFirst({
    where: {
      id: subcategoryId,
      category: { deletedAt: null },
    },
    select: {
      id: true,
      categoryId: true,
    },
  });

  if (!subcategory) {
    throw new TransactionRepositoryError(
      "MISSING_SUBCATEGORY",
      `Active subcategory '${subcategoryId}' was not found.`,
    );
  }

  if (categoryId && subcategory.categoryId !== categoryId) {
    throw new TransactionRepositoryError(
      "SUBCATEGORY_CATEGORY_MISMATCH",
      `Subcategory '${subcategoryId}' does not belong to category '${categoryId}'.`,
    );
  }

  return {
    categoryId: categoryId ?? subcategory.categoryId,
    subcategoryId,
  };
};

const assertActiveGoal = async (
  prisma: PrismaClient,
  goalId: string | null,
  transactionType: TransactionRecordType,
): Promise<void> => {
  if (transactionType === "saving" && !goalId) {
    throw new TransactionRepositoryError(
      "SAVING_REQUIRES_GOAL",
      "Saving transactions require an active goal reference.",
    );
  }

  if (!goalId) {
    return;
  }

  const goal = await prisma.goal.findFirst({
    where: {
      id: goalId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!goal) {
    throw new TransactionRepositoryError(
      "MISSING_GOAL",
      `Active goal '${goalId}' was not found.`,
    );
  }
};

const assertActiveInstallmentPlan = async (
  prisma: PrismaClient,
  installmentPlanId: string | null,
): Promise<void> => {
  if (!installmentPlanId) {
    return;
  }

  const installmentPlan = await prisma.installmentPlan.findFirst({
    where: {
      id: installmentPlanId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!installmentPlan) {
    throw new TransactionRepositoryError(
      "MISSING_INSTALLMENT_PLAN",
      `Active installment plan '${installmentPlanId}' was not found.`,
    );
  }
};

const validateReferences = async (
  prisma: PrismaClient,
  candidate: ReferenceCandidate,
): Promise<ReferenceCandidate> => {
  await assertActiveAccount(prisma, candidate.accountId);
  const classification = classifyTransaction(candidate.amount, candidate.transactionType);
  const categoryRefs = await resolveCategoryReferences(
    prisma,
    candidate.categoryId,
    candidate.subcategoryId,
  );
  await assertActiveGoal(prisma, candidate.goalId, candidate.transactionType);
  await assertActiveInstallmentPlan(prisma, candidate.installmentPlanId);
  const category = await assertActiveCategory(prisma, categoryRefs.categoryId);
  const isEligible = classification === "income"
    ? category.incomeEligible
    : classification === "expense"
      ? category.expenseEligible
      : category.savingEligible;

  if (!isEligible) {
    throw new TransactionRepositoryError(
      "CATEGORY_NOT_ELIGIBLE_FOR_CLASSIFICATION",
      `Category '${category.id}' is not eligible for ${classification} transactions.`,
    );
  }

  return {
    ...candidate,
    ...categoryRefs,
  };
};

export const createTransactionsRepository = (prisma: PrismaClient): TransactionsRepository => ({
  async listActive(filters = {}) {
    const transactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        ...(filters.accountId ? { accountId: filters.accountId } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.subcategoryId ? { subcategoryId: filters.subcategoryId } : {}),
        ...(filters.goalId ? { goalId: filters.goalId } : {}),
        ...(filters.installmentPlanId ? { installmentPlanId: filters.installmentPlanId } : {}),
        ...(filters.dateFrom || filters.dateTo
          ? {
              date: {
                ...(filters.dateFrom ? { gte: toDbDate(filters.dateFrom) } : {}),
                ...(filters.dateTo ? { lte: toDbDate(filters.dateTo) } : {}),
              },
            }
          : {}),
      },
      include: transactionInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return transactions.map(toTransactionRecord);
  },

  async getById(id) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: transactionInclude,
    });

    return transaction ? toTransactionRecord(transaction) : null;
  },

  async create(input) {
    const amount = toDecimal(input.amount);
    const references = await validateReferences(prisma, {
      accountId: input.accountId,
      categoryId: trimNullable(input.categoryId) ?? null,
      subcategoryId: trimNullable(input.subcategoryId) ?? null,
      goalId: trimNullable(input.goalId) ?? null,
      installmentPlanId: trimNullable(input.installmentPlanId) ?? null,
      transactionType: input.transactionType ?? "regular",
      amount,
    });

    const transaction = await prisma.transaction.create({
      data: {
        accountId: references.accountId,
        categoryId: references.categoryId,
        subcategoryId: references.subcategoryId,
        goalId: references.goalId,
        installmentPlanId: references.installmentPlanId,
        transactionType: TRANSACTION_TYPE_TO_PRISMA[references.transactionType],
        name: input.name.trim(),
        amount,
        currency: input.currency ?? "USD",
        date: toDbDate(input.date),
        notes: trimNullable(input.notes) ?? null,
        uiIcon: null,
        uiIconBg: null,
        cuotaInstallmentIndex: input.cuotaInstallmentIndex ?? null,
        cuotaInstallmentsCount: input.cuotaInstallmentsCount ?? null,
      },
      include: transactionInclude,
    });

    return toTransactionRecord(transaction);
  },

  async update(id, input) {
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return null;
    }

    const transactionType = input.transactionType
      ?? TRANSACTION_TYPE_FROM_PRISMA[existing.transactionType];
    const amount = input.amount !== undefined ? toDecimal(input.amount) : existing.amount;
    const references = await validateReferences(prisma, {
      accountId: input.accountId ?? existing.accountId,
      categoryId: input.categoryId !== undefined
        ? trimNullable(input.categoryId) ?? null
        : existing.categoryId,
      subcategoryId: input.subcategoryId !== undefined
        ? trimNullable(input.subcategoryId) ?? null
        : existing.subcategoryId,
      goalId: input.goalId !== undefined ? trimNullable(input.goalId) ?? null : existing.goalId,
      installmentPlanId: input.installmentPlanId !== undefined
        ? trimNullable(input.installmentPlanId) ?? null
        : existing.installmentPlanId,
      transactionType,
      amount,
    });

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        accountId: references.accountId,
        categoryId: references.categoryId,
        subcategoryId: references.subcategoryId,
        goalId: references.goalId,
        installmentPlanId: references.installmentPlanId,
        transactionType: TRANSACTION_TYPE_TO_PRISMA[references.transactionType],
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.amount !== undefined ? { amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.date !== undefined ? { date: toDbDate(input.date) } : {}),
        ...(input.notes !== undefined ? { notes: trimNullable(input.notes) ?? null } : {}),
        uiIcon: null,
        uiIconBg: null,
        ...(input.cuotaInstallmentIndex !== undefined
          ? { cuotaInstallmentIndex: input.cuotaInstallmentIndex }
          : {}),
        ...(input.cuotaInstallmentsCount !== undefined
          ? { cuotaInstallmentsCount: input.cuotaInstallmentsCount }
          : {}),
      },
      include: transactionInclude,
    });

    return toTransactionRecord(transaction);
  },

  async softDelete(id) {
    const existing = await prisma.transaction.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },
});
