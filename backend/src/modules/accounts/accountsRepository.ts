import { Prisma, type CurrencyCode, type PrismaClient } from "../../generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export interface AccountRecord {
  id: string;
  name: string;
  balance: string;
  currency: CurrencyCode;
  icon: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateAccountInput {
  name: string;
  balance?: DecimalInput;
  currency?: CurrencyCode;
  icon: string;
}

export interface UpdateAccountInput {
  name?: string;
  balance?: DecimalInput;
  currency?: CurrencyCode;
  icon?: string;
}

export type AccountsRepositoryErrorCode = "ACCOUNT_IN_USE";

export class AccountsRepositoryError extends Error {
  public readonly code: AccountsRepositoryErrorCode;

  public constructor(code: AccountsRepositoryErrorCode, message: string) {
    super(message);
    this.name = "AccountsRepositoryError";
    this.code = code;
  }
}

type AccountModel = NonNullable<Awaited<ReturnType<PrismaClient["account"]["findUnique"]>>>;

export interface AccountsRepository {
  listActive: () => Promise<AccountRecord[]>;
  getById: (id: string) => Promise<AccountRecord | null>;
  create: (input: CreateAccountInput) => Promise<AccountRecord>;
  update: (id: string, input: UpdateAccountInput) => Promise<AccountRecord | null>;
  softDelete: (id: string) => Promise<boolean>;
}

const toDecimal = (value: DecimalInput | undefined): Prisma.Decimal => {
  return new Prisma.Decimal(value ?? 0);
};

const toIso = (value: Date): string => value.toISOString();

const toAccountRecord = (account: AccountModel): AccountRecord => ({
  id: account.id,
  name: account.name,
  balance: account.balance.toFixed(2),
  currency: account.currency,
  icon: account.icon,
  createdAt: toIso(account.createdAt),
  updatedAt: toIso(account.updatedAt),
  deletedAt: account.deletedAt ? toIso(account.deletedAt) : null,
});

export const createAccountsRepository = (prisma: PrismaClient): AccountsRepository => ({
  async listActive() {
    const accounts = await prisma.account.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    });

    return accounts.map(toAccountRecord);
  },

  async getById(id) {
    const account = await prisma.account.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    return account ? toAccountRecord(account) : null;
  },

  async create(input) {
    const account = await prisma.account.create({
      data: {
        name: input.name.trim(),
        balance: toDecimal(input.balance),
        currency: input.currency ?? "USD",
        icon: input.icon.trim(),
      },
    });

    return toAccountRecord(account);
  },

  async update(id, input) {
    const existing = await prisma.account.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return null;
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.balance !== undefined ? { balance: toDecimal(input.balance) } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
      },
    });

    return toAccountRecord(account);
  },

  async softDelete(id) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.account.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existing) {
        return false;
      }

      const activeTransactionCount = await tx.transaction.count({
        where: {
          accountId: id,
          deletedAt: null,
        },
      });

      if (activeTransactionCount > 0) {
        throw new AccountsRepositoryError(
          "ACCOUNT_IN_USE",
          "Account has active transactions and cannot be deleted without resolving them first.",
        );
      }

      await tx.account.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return true;
    });
  },
});
