# Clocket Frontend

Frontend scaffold using Vite + React.

Quick start:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

App runs on port `5173` by default. It expects the backend at `http://127.0.0.1:3001` unless `VITE_API_PROXY_TARGET` is set.

## Market quotes integration

- Frontend requests market data through `/api/market/quote`.
- Vite dev server proxies `/api` to `VITE_API_PROXY_TARGET` or `http://127.0.0.1:3001`.
- Start backend and frontend separately, or use root `npm run dev` to orchestrate both.
- Use root `npm run docker:up` for the full containerized stack.
