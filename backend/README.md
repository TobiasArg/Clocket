# Clocket Backend

Backend scaffold using Next.js (API routes).

Quick start:

```bash
npm --prefix backend install
npm --prefix backend run dev
```

The backend dev script runs `prisma generate` and starts the API server on port `3001`. From the repository root, `npm run dev:backend` also starts local PostgreSQL and applies existing migrations before calling this script.

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

The persistence schema targets Prisma ORM + PostgreSQL. From the repository root, start the local database with:

```bash
npm run db:up
```

Then validate and generate Prisma artifacts:

```bash
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
```

To create new migrations intentionally, use:

```bash
npm run db:migrate:dev
```

For the full containerized development stack, run from the repository root:

```bash
npm run docker:up
```

Database-backed smoke tests are opt-in so normal unit tests do not require a running PostgreSQL instance:

```bash
npm run test:db
```
