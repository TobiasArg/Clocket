# Clocket Frontend

Frontend scaffold using Vite + React.

Quick start:

```bash
cd frontend
npm install
npm run dev
```

App runs on port 5173 by default. It expects the backend at `http://localhost:3001`.

## Market quotes integration

- Frontend requests market data through `/api/market/quote`.
- Vite dev server proxies `/api` to `http://localhost:3001`.
- Start backend and frontend together to enable real-time investment pricing.
