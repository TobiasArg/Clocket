export interface DateParts {
  year: number;
  month: number;
  day: number;
}

const YEAR_MONTH_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const parseDateParts = (value: string): DateParts | null => {
  const match = YEAR_MONTH_DAY_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return null;
  }

  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) {
    return null;
  }

  return { year, month, day };
};

export const compareDateParts = (left: DateParts, right: DateParts): number => {
  if (left.year !== right.year) {
    return left.year - right.year;
  }

  if (left.month !== right.month) {
    return left.month - right.month;
  }

  return left.day - right.day;
};

export const getTodayDatePartsLocal = (now: Date = new Date()): DateParts => {
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
};

export const isFutureDateParts = (
  dateParts: DateParts,
  todayDateParts: DateParts = getTodayDatePartsLocal(),
): boolean => {
  return compareDateParts(dateParts, todayDateParts) > 0;
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

export const formatDateParts = (parts: DateParts): string => {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

const getCreatedAtDateParts = (createdAt: string): DateParts | null => {
  const parsedPrefix = parseDateParts(createdAt.slice(0, 10));
  if (parsedPrefix) {
    return parsedPrefix;
  }

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return {
    year: parsedDate.getFullYear(),
    month: parsedDate.getMonth() + 1,
    day: parsedDate.getDate(),
  };
};

export const getInstallmentDateParts = (
  createdAt: string,
  installmentIndex: number,
): DateParts | null => {
  if (!Number.isFinite(installmentIndex) || installmentIndex < 1) {
    return null;
  }

  const baseDateParts = getCreatedAtDateParts(createdAt);
  if (!baseDateParts) {
    return null;
  }

  const offsetMonthIndex = (baseDateParts.month - 1) + installmentIndex;
  const targetYear = baseDateParts.year + Math.floor(offsetMonthIndex / 12);
  const targetMonth = (offsetMonthIndex % 12) + 1;
  const targetDay = Math.min(baseDateParts.day, getDaysInMonth(targetYear, targetMonth));

  return {
    year: targetYear,
    month: targetMonth,
    day: targetDay,
  };
};

export const getInstallmentDateString = (
  createdAt: string,
  installmentIndex: number,
): string | null => {
  const parts = getInstallmentDateParts(createdAt, installmentIndex);
  if (!parts) {
    return null;
  }

  return formatDateParts(parts);
};
