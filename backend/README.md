# Clocket Backend

Backend scaffold using Next.js (API routes).

Quick start:

```bash
cd backend
npm install
npm run dev
```

The dev server runs on port 3001 (configured in package scripts).

## Market Quotes API

Endpoint:

- `GET /api/market/quotes?symbols=AAPL,MSFT`
- `GET /api/market/quote?assetType=stock&ticker=AAPL`
- `GET /api/market/quote?assetType=crypto&ticker=BTC`

Required environment variables:

- `ALPHA_VANTAGE_API_KEY`

Optional environment variables:

- `ALPACA_FEED=iex`
- `MARKET_QUOTES_TTL_MS=15000`
