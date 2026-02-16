import {
  getCurrentMonthWindow,
  type MonthWindow,
} from "@/domain/transactions/monthlyBalance";
import type { CuotaPlanItem } from "@/domain/cuotas/repository";

const YEAR_MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

const parseYearMonth = (value: string): { year: number; monthIndex: number } | null => {
  const match = YEAR_MONTH_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (!Number.isFinite(year) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return {
    year,
    monthIndex: monthNumber - 1,
  };
};

const getMonthDelta = (
  startYear: number,
  startMonthIndex: number,
  targetYear: number,
  targetMonthIndex: number,
): number => {
  return (targetYear - startYear) * 12 + (targetMonthIndex - startMonthIndex);
};

export const isCuotaActiveInMonth = (
  cuota: CuotaPlanItem,
  monthWindow: MonthWindow = getCurrentMonthWindow(),
): boolean => {
  const start = parseYearMonth(cuota.startMonth);
  if (!start) {
    return false;
  }

  const targetYear = monthWindow.start.getFullYear();
  const targetMonthIndex = monthWindow.start.getMonth();
  const monthDelta = getMonthDelta(
    start.year,
    start.monthIndex,
    targetYear,
    targetMonthIndex,
  );

  const isWithinSchedule = monthDelta >= 0 && monthDelta < cuota.installmentsCount;
  const hasPendingInstallments = cuota.paidInstallmentsCount < cuota.installmentsCount;

  return isWithinSchedule && hasPendingInstallments;
};

export const getPendingInstallmentsTotalForMonth = (
  cuotas: CuotaPlanItem[],
  monthWindow: MonthWindow = getCurrentMonthWindow(),
): number => {
  return cuotas.reduce((total, cuota) => {
    if (!isCuotaActiveInMonth(cuota, monthWindow)) {
      return total;
    }

    return total + cuota.installmentAmount;
  }, 0);
};
