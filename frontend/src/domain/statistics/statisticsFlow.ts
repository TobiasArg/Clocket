import type { StatisticsFlowDay } from "@/types";
import type { TransactionItem } from "@/domain/transactions/repository";
import { getTransactionDateForMonthBalance } from "@/domain/transactions/monthlyBalance";
import {
  DEFAULT_CATEGORY_FLOW_COLOR,
  resolveCssColorFromBgClass,
} from "@/domain/categories/categoryColorResolver";

const parseSignedAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9+.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildWeekdayLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", "").toUpperCase()
);

const buildDateLabel = (date: Date): string => (
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(date).replace(".", "")
);

interface FlowCategoryEntry {
  amount: number;
  color: string;
  label: string;
}

const buildCategoryFallbackKey = (label: string): string => (
  `name:${label.toLocaleLowerCase("es-ES")}`
);

interface BuildStatisticsDailyFlowOptions {
  categoryColorById?: Map<string, string>;
  categoryNameById: Map<string, string>;
  now?: Date;
  transactions: TransactionItem[];
}

export const buildStatisticsDailyFlow = ({
  categoryColorById = new Map<string, string>(),
  categoryNameById,
  now = new Date(),
  transactions,
}: BuildStatisticsDailyFlowOptions): StatisticsFlowDay[] => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today);
  start.setDate(today.getDate() - 6);

  const dayBuckets = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      dateKey: buildDateKey(date),
      expenseMap: new Map<string, FlowCategoryEntry>(),
      expenseTotal: 0,
      incomeMap: new Map<string, FlowCategoryEntry>(),
      incomeTotal: 0,
    };
  });

  const dayByKey = new Map(dayBuckets.map((bucket) => [bucket.dateKey, bucket]));
  const rangeStart = dayBuckets[0]?.date;
  const rangeEnd = new Date(dayBuckets[dayBuckets.length - 1]?.date ?? now);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  transactions.forEach((transaction) => {
    if (transaction.transactionType === "saving") {
      return;
    }

    const transactionDate = getTransactionDateForMonthBalance(transaction);
    if (!transactionDate || !rangeStart || transactionDate < rangeStart || transactionDate >= rangeEnd) {
      return;
    }

    const day = dayByKey.get(buildDateKey(transactionDate));
    if (!day) {
      return;
    }

    const amount = parseSignedAmount(transaction.amount);
    if (amount === 0) {
      return;
    }

    const defaultCategoryLabel = amount > 0 ? "Ingreso" : "Uncategorized";
    const categoryLabel = (
      transaction.category?.trim() ||
      defaultCategoryLabel
    );
    const categoryKey = transaction.categoryId
      ? `id:${transaction.categoryId}`
      : buildCategoryFallbackKey(categoryLabel);
    const resolvedLabel = transaction.categoryId
      ? (categoryNameById.get(transaction.categoryId) ?? categoryLabel)
      : categoryLabel;
    const resolvedColor = transaction.categoryId
      ? (categoryColorById.get(transaction.categoryId) ?? DEFAULT_CATEGORY_FLOW_COLOR)
      : resolveCssColorFromBgClass(transaction.iconBg, DEFAULT_CATEGORY_FLOW_COLOR);
    const absoluteAmount = Math.abs(amount);

    if (amount > 0) {
      const current = day.incomeMap.get(categoryKey);
      day.incomeMap.set(categoryKey, {
        amount: (current?.amount ?? 0) + absoluteAmount,
        color: current?.color ?? resolvedColor,
        label: current?.label ?? resolvedLabel,
      });
      day.incomeTotal += absoluteAmount;
      return;
    }

    const current = day.expenseMap.get(categoryKey);
    day.expenseMap.set(categoryKey, {
      amount: (current?.amount ?? 0) + absoluteAmount,
      color: current?.color ?? resolvedColor,
      label: current?.label ?? resolvedLabel,
    });
    day.expenseTotal += absoluteAmount;
  });

  return dayBuckets.map((day) => ({
    dateKey: day.dateKey,
    dateLabel: buildDateLabel(day.date),
    expenseByCategory: Array.from(day.expenseMap.values())
      .sort((left, right) => right.amount - left.amount)
      .map((entry) => ({
        amount: entry.amount,
        category: entry.label,
        color: entry.color,
      })),
    expenseTotal: day.expenseTotal,
    incomeByCategory: Array.from(day.incomeMap.values())
      .sort((left, right) => right.amount - left.amount)
      .map((entry) => ({
        amount: entry.amount,
        category: entry.label,
        color: entry.color,
      })),
    incomeTotal: day.incomeTotal,
    label: buildWeekdayLabel(day.date),
  }));
};
