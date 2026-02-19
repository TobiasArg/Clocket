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

Required environment variables:

- `APCA_API_KEY_ID`
- `APCA_API_SECRET_KEY`

Optional environment variables:

- `ALPACA_FEED=iex`
- `MARKET_QUOTES_TTL_MS=15000`
