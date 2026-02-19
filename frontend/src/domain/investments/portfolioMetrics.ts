import type { InvestmentPositionItem, InvestmentSnapshotItem } from "@/domain/investments/repository";
import type { AssetRefs, HistoricalPoint } from "@/domain/investments/portfolioTypes";

export interface PositionMetrics {
  amount: number;
  investedUSD: number;
  buyPrice: number;
  currentPrice: number;
  currentValueUSD: number;
  pnlTotalUSD: number;
  pnlTotalPct: number;
  pnlDailyUSD: number;
  pnlDailyPct: number;
  pnlMonthUSD: number;
  pnlMonthPct: number;
  lastUpdatedTimestamp: string | null;
}

const round = (value: number): number => {
  return Math.round(value * 1000000) / 1000000;
};

export const computePositionMetrics = (
  position: InvestmentPositionItem,
  currentPrice: number,
  refs: AssetRefs,
  lastUpdatedTimestamp: string | null,
): PositionMetrics => {
  const investedUSD = position.usd_gastado;
  const amount = position.amount;
  const currentValueUSD = amount * currentPrice;

  const pnlTotalUSD = currentValueUSD - investedUSD;
  const pnlTotalPct = investedUSD > 0
    ? (pnlTotalUSD / investedUSD) * 100
    : 0;

  const dailyRefPrice = refs.dailyRefPrice;
  const pnlDailyUSD = amount * (currentPrice - dailyRefPrice);
  const pnlDailyPct = dailyRefPrice > 0
    ? ((currentPrice - dailyRefPrice) / dailyRefPrice) * 100
    : 0;

  const monthRefPrice = refs.monthRefPrice;
  const pnlMonthUSD = amount * (currentPrice - monthRefPrice);
  const pnlMonthPct = monthRefPrice > 0
    ? ((currentPrice - monthRefPrice) / monthRefPrice) * 100
    : 0;

  return {
    amount: round(amount),
    investedUSD: round(investedUSD),
    buyPrice: round(position.buy_price),
    currentPrice: round(currentPrice),
    currentValueUSD: round(currentValueUSD),
    pnlTotalUSD: round(pnlTotalUSD),
    pnlTotalPct: round(pnlTotalPct),
    pnlDailyUSD: round(pnlDailyUSD),
    pnlDailyPct: round(pnlDailyPct),
    pnlMonthUSD: round(pnlMonthUSD),
    pnlMonthPct: round(pnlMonthPct),
    lastUpdatedTimestamp,
  };
};

export const buildHistoricalSeries = (
  position: InvestmentPositionItem,
  snapshots: InvestmentSnapshotItem[],
): HistoricalPoint[] => {
  return snapshots
    .slice()
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
    .map((snapshot) => {
      const equity = position.amount * snapshot.price;
      const pnlVsInvested = equity - position.usd_gastado;

      return {
        timestamp: snapshot.timestamp,
        equity: round(equity),
        pnlVsInvested: round(pnlVsInvested),
      };
    });
};
