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

- `GET /api/market/quote?assetType=stock&ticker=AAPL`
- `GET /api/market/quote?assetType=crypto&ticker=BTC`

Required environment variables:

- `ALPHA_VANTAGE_API_KEY`

Optional environment variables:

- `ALPHA_VANTAGE_TIMEOUT_MS` (defaults to `12000`)

Validation:

```bash
npm run typecheck
npm test
npm run build
```

## PostgreSQL + Prisma foundation

The persistence schema targets Prisma ORM + PostgreSQL. Start the local database with:

```bash
docker compose up -d postgres
```

Then validate and generate Prisma artifacts:

```bash
npm run prisma:validate
npm run prisma:generate
```

Database-backed smoke tests are opt-in so normal unit tests do not require a running PostgreSQL instance:

```bash
npm run test:db
```
