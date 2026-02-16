import type { InvestmentPosition } from "@/types";

export type InvestmentPositionItem = InvestmentPosition;

export interface CreateInvestmentInput {
  ticker: string;
  name: string;
  exchange?: string;
  shares: number;
  costBasis: number;
  currentPrice?: number;
  priceSource?: "market" | "manual";
  manualPrice?: number;
}

export interface UpdateInvestmentPatch {
  ticker?: string;
  name?: string;
  exchange?: string;
  shares?: number;
  costBasis?: number;
  currentPrice?: number;
  priceSource?: "market" | "manual";
  manualPrice?: number;
}

export interface InvestmentsRepository {
  list: () => Promise<InvestmentPositionItem[]>;
  getById: (id: string) => Promise<InvestmentPositionItem | null>;
  create: (input: CreateInvestmentInput) => Promise<InvestmentPositionItem>;
  update: (id: string, patch: UpdateInvestmentPatch) => Promise<InvestmentPositionItem | null>;
  remove: (id: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
}
