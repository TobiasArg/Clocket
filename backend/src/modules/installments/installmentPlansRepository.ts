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
  markNextDuePaid: (id: string, now: Date) => Promise<MarkNextDuePaidResult | null>;
  reconcileDue: (now: Date) => Promise<ReconcileDueResult[]>;
  softDelete: (id: string) => Promise<boolean>;
  softDeleteAll: () => Promise<number>;
}

export type GeneratedInstallmentLedgerEffectStatus = "created" | "already_exists";

export interface GeneratedInstallmentLedgerEffectRecord {
  planId: string;
  installmentIndex: number;
  status: GeneratedInstallmentLedgerEffectStatus;
}

export type MarkNextDuePaidStatus = "paid" | "already_finished" | "blocked_future";

export interface MarkNextDuePaidResult {
  plan: InstallmentPlanRecord;
  status: MarkNextDuePaidStatus;
  installmentIndex: number | null;
  dueDate: string | null;
  effects: GeneratedInstallmentLedgerEffectRecord[];
}

export interface ReconcileDueResult {
  plan: InstallmentPlanRecord;
  fromPaidInstallmentsCount: number;
  toPaidInstallmentsCount: number;
  effects: GeneratedInstallmentLedgerEffectRecord[];
}

type InstallmentPlanModel = NonNullable<Awaited<ReturnType<PrismaClient["installmentPlan"]["findUnique"]>>>;

type PrismaTransactionClient = Prisma.TransactionClient;

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

const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

const toUtcDateOnly = (value: Date): Date => new Date(Date.UTC(
  value.getUTCFullYear(),
  value.getUTCMonth(),
  value.getUTCDate(),
));

const getInstallmentDueDate = (startMonth: Date, installmentIndex: number): Date => (
  addMonths(startMonth, installmentIndex - 1)
);

const getElapsedDueInstallmentsCount = (
  plan: Pick<InstallmentPlanModel, "installmentsCount" | "startMonth">,
  now: Date,
): number => {
  const today = toUtcDateOnly(now);
  const start = toUtcDateOnly(plan.startMonth);

  if (today.getTime() < start.getTime()) {
    return 0;
  }

  const elapsedMonths = (today.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (today.getUTCMonth() - start.getUTCMonth());
  return Math.min(plan.installmentsCount, Math.max(0, elapsedMonths + 1));
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

const CREDIT_CARD_ACCOUNT_NAME = "Tarjeta de Credito";
const CREDIT_CARD_ACCOUNT_ICON = "credit-card";

const ensureGeneratedTransactionAccount = async (
  tx: Pick<PrismaTransactionClient, "account">,
  currency: CurrencyCode,
): Promise<string> => {
  const existing = await tx.account.findFirst({
    where: { name: CREDIT_CARD_ACCOUNT_NAME, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing.id;
  }

  const created = await tx.account.create({
    data: {
      name: CREDIT_CARD_ACCOUNT_NAME,
      balance: new Prisma.Decimal(0),
      currency,
      icon: CREDIT_CARD_ACCOUNT_ICON,
    },
    select: { id: true },
  });

  return created.id;
};

const buildGeneratedTransactionForIndex = (
  plan: InstallmentPlanModel,
  accountId: string,
  installmentIndex: number,
): Prisma.TransactionCreateManyInput => ({
  accountId,
  categoryId: plan.categoryId,
  subcategoryId: plan.subcategoryId,
  installmentPlanId: plan.id,
  transactionType: "REGULAR",
  name: plan.title,
  amount: plan.installmentAmount.negated(),
  currency: plan.currency,
  date: getInstallmentDueDate(plan.startMonth, installmentIndex),
  uiIcon: "credit-card",
  uiIconBg: "bg-[#18181B]",
  cuotaInstallmentIndex: installmentIndex,
  cuotaInstallmentsCount: plan.installmentsCount,
});

const ensureGeneratedTransactionForIndex = async (
  tx: Pick<PrismaTransactionClient, "transaction">,
  plan: InstallmentPlanModel,
  accountId: string,
  installmentIndex: number,
): Promise<GeneratedInstallmentLedgerEffectRecord> => {
  const result = await tx.transaction.createMany({
    data: [buildGeneratedTransactionForIndex(plan, accountId, installmentIndex)],
    skipDuplicates: true,
  });

  return {
    planId: plan.id,
    installmentIndex,
    status: result.count === 1 ? "created" : "already_exists",
  };
};

const reconcileGeneratedTransactions = async (
  tx: Pick<PrismaTransactionClient, "account" | "transaction">,
  plan: InstallmentPlanModel,
  targetPaidInstallmentsCount: number,
): Promise<GeneratedInstallmentLedgerEffectRecord[]> => {
  const accountId = await ensureGeneratedTransactionAccount(tx, plan.currency);
  const effects: GeneratedInstallmentLedgerEffectRecord[] = [];

  for (let index = 1; index <= targetPaidInstallmentsCount; index += 1) {
    effects.push(await ensureGeneratedTransactionForIndex(tx, plan, accountId, index));
  }

  return effects;
};

const softDeleteGeneratedTransactionsByPlanId = async (
  tx: Pick<PrismaTransactionClient, "transaction">,
  planId: string,
  deletedAt: Date,
): Promise<void> => {
  await tx.transaction.updateMany({
    where: { installmentPlanId: planId, deletedAt: null },
    data: { deletedAt },
  });
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

  async markNextDuePaid(id, now) {
    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.installmentPlan.findFirst({ where: { id, deletedAt: null } });

      if (!plan) {
        return null;
      }

      if (plan.paidInstallmentsCount >= plan.installmentsCount) {
        return {
          plan,
          status: "already_finished" as const,
          installmentIndex: null,
          dueDate: null,
          effects: [],
        };
      }

      const installmentIndex = plan.paidInstallmentsCount + 1;
      const dueDate = getInstallmentDueDate(plan.startMonth, installmentIndex);

      if (toUtcDateOnly(dueDate).getTime() > toUtcDateOnly(now).getTime()) {
        return {
          plan,
          status: "blocked_future" as const,
          installmentIndex,
          dueDate: toDateOnly(dueDate),
          effects: [],
        };
      }

      const effects = await reconcileGeneratedTransactions(tx, plan, installmentIndex);
      await tx.installmentPlan.updateMany({
        where: {
          id: plan.id,
          deletedAt: null,
          paidInstallmentsCount: { lt: installmentIndex },
        },
        data: { paidInstallmentsCount: installmentIndex },
      });
      const updatedPlan = await tx.installmentPlan.findFirst({ where: { id: plan.id, deletedAt: null } }) ?? plan;

      return {
        plan: updatedPlan,
        status: "paid" as const,
        installmentIndex,
        dueDate: toDateOnly(dueDate),
        effects: effects.filter((effect) => effect.installmentIndex === installmentIndex),
      };
    });

    return result
      ? { ...result, plan: toInstallmentPlanRecord(result.plan) }
      : null;
  },

  async reconcileDue(now) {
    const results = await prisma.$transaction(async (tx) => {
      const plans = await tx.installmentPlan.findMany({ where: { deletedAt: null } });
      const reconciled: Array<{
        plan: InstallmentPlanModel;
        fromPaidInstallmentsCount: number;
        toPaidInstallmentsCount: number;
        effects: GeneratedInstallmentLedgerEffectRecord[];
      }> = [];

      for (const plan of plans) {
        const elapsedDueInstallments = getElapsedDueInstallmentsCount(plan, now);
        const targetPaidInstallmentsCount = Math.max(
          plan.paidInstallmentsCount,
          elapsedDueInstallments,
        );

        if (targetPaidInstallmentsCount <= 0) {
          reconciled.push({
            plan,
            fromPaidInstallmentsCount: plan.paidInstallmentsCount,
            toPaidInstallmentsCount: plan.paidInstallmentsCount,
            effects: [],
          });
          continue;
        }

        const effects = await reconcileGeneratedTransactions(
          tx,
          plan,
          targetPaidInstallmentsCount,
        );
        if (targetPaidInstallmentsCount > plan.paidInstallmentsCount) {
          await tx.installmentPlan.updateMany({
            where: {
              id: plan.id,
              deletedAt: null,
              paidInstallmentsCount: { lt: targetPaidInstallmentsCount },
            },
            data: { paidInstallmentsCount: targetPaidInstallmentsCount },
          });
        }
        const updatedPlan = await tx.installmentPlan.findFirst({ where: { id: plan.id, deletedAt: null } }) ?? plan;

        reconciled.push({
          plan: updatedPlan,
          fromPaidInstallmentsCount: plan.paidInstallmentsCount,
          toPaidInstallmentsCount: updatedPlan.paidInstallmentsCount,
          effects,
        });
      }

      return reconciled;
    });

    return results.map((result) => ({
      ...result,
      plan: toInstallmentPlanRecord(result.plan),
    }));
  },

  async softDelete(id) {
    const existing = await prisma.installmentPlan.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await prisma.$transaction(async (tx) => {
      const deletedAt = new Date();
      await tx.installmentPlan.update({
        where: { id },
        data: { deletedAt },
      });
      await softDeleteGeneratedTransactionsByPlanId(tx, id, deletedAt);
    });

    return true;
  },

  async softDeleteAll() {
    const result = await prisma.$transaction(async (tx) => {
      const deletedAt = new Date();
      const activePlans = await tx.installmentPlan.findMany({
        where: { deletedAt: null },
        select: { id: true },
      });
      const updateResult = await tx.installmentPlan.updateMany({
        where: { deletedAt: null },
        data: { deletedAt },
      });

      for (const plan of activePlans) {
        await softDeleteGeneratedTransactionsByPlanId(tx, plan.id, deletedAt);
      }

      return updateResult;
    });

    return result.count;
  },
});
