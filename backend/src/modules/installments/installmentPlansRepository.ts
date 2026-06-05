import { Prisma, type CurrencyCode, type PrismaClient } from "../../generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export type InstallmentPlansRepositoryErrorCode =
  | "MISSING_ACCOUNT"
  | "MISSING_CATEGORY"
  | "MISSING_SUBCATEGORY";

export class InstallmentPlansRepositoryError extends Error {
  public readonly code: InstallmentPlansRepositoryErrorCode;

  public constructor(code: InstallmentPlansRepositoryErrorCode, message: string) {
    super(message);
    this.name = "InstallmentPlansRepositoryError";
    this.code = code;
  }
}

export interface InstallmentPlanRecord {
  id: string;
  title: string;
  description: string | null;
  totalAmount: string;
  currency: CurrencyCode;
  installmentsCount: number;
  installmentAmount: string;
  startMonth: string;
  paidInstallmentsCount: number;
  categoryId: string | null;
  subcategoryId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateInstallmentPlanInput {
  title: string;
  description?: string | null;
  totalAmount: DecimalInput;
  currency?: CurrencyCode;
  installmentsCount: number;
  installmentAmount?: DecimalInput;
  startMonth: string | Date;
  paidInstallmentsCount?: number;
  categoryId?: string | null;
  subcategoryId?: string | null;
  subcategoryName?: string | null;
  generatedTransactionAccountId?: string;
}

export type UpdateInstallmentPlanInput = Partial<CreateInstallmentPlanInput>;

export interface InstallmentPlansRepository {
  listActive: () => Promise<InstallmentPlanRecord[]>;
  getById: (id: string) => Promise<InstallmentPlanRecord | null>;
  create: (input: CreateInstallmentPlanInput) => Promise<InstallmentPlanRecord>;
  update: (id: string, input: UpdateInstallmentPlanInput) => Promise<InstallmentPlanRecord | null>;
  softDelete: (id: string) => Promise<boolean>;
  softDeleteAll: () => Promise<number>;
}

type InstallmentPlanModel = NonNullable<Awaited<ReturnType<PrismaClient["installmentPlan"]["findUnique"]>>>;

interface NormalizedRefs {
  categoryId: string | null;
  subcategoryId: string | null;
}

interface GeneratedTransactionInput {
  accountId: string;
  planId: string;
  title: string;
  installmentAmount: Prisma.Decimal;
  currency: CurrencyCode;
  startMonth: Date;
  paidInstallmentsCount: number;
  installmentsCount: number;
  categoryId: string | null;
  subcategoryId: string | null;
}

const toDecimal = (value: DecimalInput): Prisma.Decimal => new Prisma.Decimal(value);

const toIso = (value: Date): string => value.toISOString();

const toYearMonth = (value: Date): string => value.toISOString().slice(0, 7);

const toStartMonth = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
  }

  return new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`);
};

const addMonths = (value: Date, months: number): Date => (
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1))
);

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

const normalizeInstallmentsCount = (value: number): number => Math.max(1, Math.floor(value));

const normalizePaidInstallmentsCount = (value: number | undefined, installmentsCount: number): number => {
  const normalized = Math.max(0, Math.floor(value ?? 0));
  return Math.min(normalized, installmentsCount);
};

const toInstallmentPlanRecord = (plan: InstallmentPlanModel): InstallmentPlanRecord => ({
  id: plan.id,
  title: plan.title,
  description: plan.description,
  totalAmount: plan.totalAmount.toFixed(2),
  currency: plan.currency,
  installmentsCount: plan.installmentsCount,
  installmentAmount: plan.installmentAmount.toFixed(2),
  startMonth: toYearMonth(plan.startMonth),
  paidInstallmentsCount: plan.paidInstallmentsCount,
  categoryId: plan.categoryId,
  subcategoryId: plan.subcategoryId,
  createdAt: toIso(plan.createdAt),
  updatedAt: toIso(plan.updatedAt),
  deletedAt: plan.deletedAt ? toIso(plan.deletedAt) : null,
});

const assertActiveAccount = async (prisma: PrismaClient, accountId: string | undefined): Promise<void> => {
  if (!accountId) {
    return;
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, deletedAt: null },
    select: { id: true },
  });

  if (!account) {
    throw new InstallmentPlansRepositoryError(
      "MISSING_ACCOUNT",
      `Active account '${accountId}' was not found.`,
    );
  }
};

const resolveCategoryRefs = async (
  prisma: PrismaClient,
  categoryId: string | null,
  subcategoryId: string | null,
  subcategoryName?: string | null,
): Promise<NormalizedRefs> => {
  const normalizedSubcategoryName = trimNullable(subcategoryName) ?? null;
  if (!subcategoryId && normalizedSubcategoryName && categoryId) {
    const subcategory = await prisma.subcategory.findFirst({
      where: { categoryId, name: normalizedSubcategoryName, category: { deletedAt: null } },
      select: { id: true, categoryId: true },
    });
    if (!subcategory) {
      throw new InstallmentPlansRepositoryError(
        "MISSING_SUBCATEGORY",
        `Active subcategory '${normalizedSubcategoryName}' was not found.`,
      );
    }
    return { categoryId: subcategory.categoryId, subcategoryId: subcategory.id };
  }

  if (!subcategoryId) {
    if (!categoryId) {
      return { categoryId: null, subcategoryId: null };
    }

    const category = await prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
      select: { id: true },
    });

    if (!category) {
      throw new InstallmentPlansRepositoryError(
        "MISSING_CATEGORY",
        `Active category '${categoryId}' was not found.`,
      );
    }

    return { categoryId, subcategoryId: null };
  }

  const subcategory = await prisma.subcategory.findFirst({
    where: {
      id: subcategoryId,
      ...(categoryId ? { categoryId } : {}),
      category: { deletedAt: null },
    },
    select: { id: true, categoryId: true },
  });

  if (!subcategory) {
    throw new InstallmentPlansRepositoryError(
      "MISSING_SUBCATEGORY",
      `Active subcategory '${subcategoryId}' was not found.`,
    );
  }

  return { categoryId: categoryId ?? subcategory.categoryId, subcategoryId };
};

const buildGeneratedTransactions = (input: GeneratedTransactionInput): Prisma.TransactionCreateManyInput[] => {
  const transactions: Prisma.TransactionCreateManyInput[] = [];

  for (let index = 1; index <= input.paidInstallmentsCount; index += 1) {
    transactions.push({
      accountId: input.accountId,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId,
      installmentPlanId: input.planId,
      transactionType: "REGULAR",
      name: input.title,
      amount: input.installmentAmount.negated(),
      currency: input.currency,
      date: addMonths(input.startMonth, index - 1),
      uiIcon: "credit-card",
      uiIconBg: "bg-[#18181B]",
      cuotaInstallmentIndex: index,
      cuotaInstallmentsCount: input.installmentsCount,
    });
  }

  return transactions;
};

const syncGeneratedTransactions = async (
  tx: Pick<PrismaClient, "transaction">,
  input: GeneratedTransactionInput,
): Promise<void> => {
  await tx.transaction.deleteMany({ where: { installmentPlanId: input.planId } });
  const transactions = buildGeneratedTransactions(input);

  if (transactions.length === 0) {
    return;
  }

  await tx.transaction.createMany({ data: transactions });
};

export const createInstallmentPlansRepository = (prisma: PrismaClient): InstallmentPlansRepository => ({
  async listActive() {
    const plans = await prisma.installmentPlan.findMany({
      where: { deletedAt: null },
      orderBy: [{ startMonth: "desc" }, { createdAt: "desc" }],
    });

    return plans.map(toInstallmentPlanRecord);
  },

  async getById(id) {
    const plan = await prisma.installmentPlan.findFirst({
      where: { id, deletedAt: null },
    });

    return plan ? toInstallmentPlanRecord(plan) : null;
  },

  async create(input) {
    const installmentsCount = normalizeInstallmentsCount(input.installmentsCount);
    const paidInstallmentsCount = normalizePaidInstallmentsCount(input.paidInstallmentsCount, installmentsCount);
    const totalAmount = toDecimal(input.totalAmount);
    const installmentAmount = input.installmentAmount
      ? toDecimal(input.installmentAmount)
      : totalAmount.div(installmentsCount).toDecimalPlaces(2);
    const startMonth = toStartMonth(input.startMonth);
    const refs = await resolveCategoryRefs(
      prisma,
      trimNullable(input.categoryId) ?? null,
      trimNullable(input.subcategoryId) ?? null,
      trimNullable(input.subcategoryName) ?? null,
    );
    await assertActiveAccount(prisma, input.generatedTransactionAccountId);

    const plan = await prisma.$transaction(async (tx) => {
      const createdPlan = await tx.installmentPlan.create({
        data: {
          title: input.title.trim(),
          description: trimNullable(input.description) ?? null,
          totalAmount,
          currency: input.currency ?? "USD",
          installmentsCount,
          installmentAmount,
          startMonth,
          paidInstallmentsCount,
          categoryId: refs.categoryId,
          subcategoryId: refs.subcategoryId,
        },
      });

      if (input.generatedTransactionAccountId) {
        await syncGeneratedTransactions(tx, {
          accountId: input.generatedTransactionAccountId,
          planId: createdPlan.id,
          title: createdPlan.title,
          installmentAmount: createdPlan.installmentAmount,
          currency: createdPlan.currency,
          startMonth: createdPlan.startMonth,
          paidInstallmentsCount: createdPlan.paidInstallmentsCount,
          installmentsCount: createdPlan.installmentsCount,
          categoryId: createdPlan.categoryId,
          subcategoryId: createdPlan.subcategoryId,
        });
      }

      return createdPlan;
    });

    return toInstallmentPlanRecord(plan);
  },

  async update(id, input) {
    const existing = await prisma.installmentPlan.findFirst({ where: { id, deletedAt: null } });
    if (!existing) {
      return null;
    }

    const installmentsCount = input.installmentsCount === undefined
      ? existing.installmentsCount
      : normalizeInstallmentsCount(input.installmentsCount);
    const paidInstallmentsCount = input.paidInstallmentsCount === undefined
      ? Math.min(existing.paidInstallmentsCount, installmentsCount)
      : normalizePaidInstallmentsCount(input.paidInstallmentsCount, installmentsCount);
    const totalAmount = input.totalAmount === undefined ? existing.totalAmount : toDecimal(input.totalAmount);
    const installmentAmount = input.installmentAmount === undefined
      ? totalAmount.div(installmentsCount).toDecimalPlaces(2)
      : toDecimal(input.installmentAmount);
    const startMonth = input.startMonth === undefined ? existing.startMonth : toStartMonth(input.startMonth);
    const refs = await resolveCategoryRefs(
      prisma,
      input.categoryId !== undefined ? trimNullable(input.categoryId) ?? null : existing.categoryId,
      input.subcategoryId !== undefined ? trimNullable(input.subcategoryId) ?? null : existing.subcategoryId,
      input.subcategoryName !== undefined ? trimNullable(input.subcategoryName) ?? null : undefined,
    );
    await assertActiveAccount(prisma, input.generatedTransactionAccountId);

    const plan = await prisma.$transaction(async (tx) => {
      const updatedPlan = await tx.installmentPlan.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.description !== undefined ? { description: trimNullable(input.description) ?? null } : {}),
          totalAmount,
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          installmentsCount,
          installmentAmount,
          startMonth,
          paidInstallmentsCount,
          categoryId: refs.categoryId,
          subcategoryId: refs.subcategoryId,
        },
      });

      if (input.generatedTransactionAccountId) {
        await syncGeneratedTransactions(tx, {
          accountId: input.generatedTransactionAccountId,
          planId: updatedPlan.id,
          title: updatedPlan.title,
          installmentAmount: updatedPlan.installmentAmount,
          currency: updatedPlan.currency,
          startMonth: updatedPlan.startMonth,
          paidInstallmentsCount: updatedPlan.paidInstallmentsCount,
          installmentsCount: updatedPlan.installmentsCount,
          categoryId: updatedPlan.categoryId,
          subcategoryId: updatedPlan.subcategoryId,
        });
      }

      return updatedPlan;
    });

    return toInstallmentPlanRecord(plan);
  },

  async softDelete(id) {
    const existing = await prisma.installmentPlan.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.installmentPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  },

  async softDeleteAll() {
    const result = await prisma.installmentPlan.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return result.count;
  },
});
