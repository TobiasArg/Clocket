export interface MarketQuote {
  symbol: string;
  price: number;
  previousClose: number | null;
  changePercent: number | null;
  currency: "USD";
  status: "ok";
  source: "alpaca";
}

export interface MarketUnavailableQuote {
  symbol: string;
  reason: string;
}

export interface MarketQuotesResult {
  asOf: string;
  feed: string;
  quotes: MarketQuote[];
  unavailable: MarketUnavailableQuote[];
}

export interface MarketQuotesRepository {
  getQuotes: (symbols: string[]) => Promise<MarketQuotesResult>;
}
