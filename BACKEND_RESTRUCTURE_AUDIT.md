# Backend Restructure Audit

Fecha: 2026-05-30

## 0. Objetivo del documento

Este documento audita el proyecto con foco exclusivo en preparar una futura reformulación del backend y una limpieza estructural del repositorio.

El audit se divide en dos frentes:

1. **Frente 1:** código dentro de `frontend/` que hoy contiene responsabilidades que deberían vivir total o parcialmente en backend.
2. **Frente 2:** estado actual de `backend/`, sus capacidades reales, brechas, riesgos y puntos de decisión.

## 1. Resumen ejecutivo

Clocket funciona hoy como una aplicación **local-first**: casi todo el estado y la mayoría de reglas de negocio viven en el frontend y persisten en `localStorage`. El backend actual no es todavía un backend de producto financiero general; es un **adaptador/proxy de cotizaciones de mercado** basado en Next.js API Routes para proteger `ALPHA_VANTAGE_API_KEY`.

La reestructuración del backend no debería empezar por cambiar framework. Primero hay que extraer responsabilidades, contratos y reglas de negocio que actualmente están dispersas en frontend.

Conclusión principal:

- El frontend contiene lógica de persistencia, migraciones, relaciones entre entidades, seguridad local, exportación de datos, generación automática de transacciones y cálculo financiero que debería migrarse gradualmente a backend si el producto apunta a persistencia real, multi-dispositivo, autenticación o integridad financiera.
- El backend actual está correcto para su único objetivo actual —proxy a Alpha Vantage—, pero es insuficiente como backend de dominio.
- Hay duplicación de contratos y normalización entre frontend y backend para market quotes.
- No hay TypeScript, tests backend, schemas, OpenAPI, DB, auth, observabilidad ni rate limiting durable.

## 2. Estado global de stack relevante

### 2.1 Frontend

- React `18.3.1`.
- Vite `5.4.21`.
- TypeScript `5.9.3`.
- Tailwind CSS `4.1.18`.
- Axios `1.13.5`.
- Vitest `4.0.18`.
- Persistencia principal: `localStorage`.
- Proxy dev: `frontend/vite.config.ts` proxya `/api` a `http://127.0.0.1:3001`.

### 2.2 Backend

- Next.js `14.2.35` con API Routes en `pages/api`.
- JavaScript, no TypeScript.
- Axios `1.13.5`.
- Puerto `3001`.
- Endpoint real de negocio: `GET /api/market/quote`.
- Provider externo: Alpha Vantage.

---

# Frente 1 — Audit de frontend: código que debería estar en backend

## 3. Hallazgo principal del frente 1

El frontend contiene dos grandes grupos de lógica:

1. **Lógica que puede permanecer en frontend:** presentación, formatting, estado de UI, view models, navegación, componentes, interacción táctil, memoización y preferencias visuales.
2. **Lógica que debería moverse al backend si se quiere backend real:** persistencia, migraciones, reglas de integridad, relaciones entre entidades, generación automática de entidades, validación canónica, cálculo financiero persistente, seguridad, export/import y orquestación de providers.

## 4. Persistencia localStorage que debería migrar a backend

### 4.1 Repositorios actuales en frontend

| Dominio | Archivo actual | Responsabilidad actual | Debería migrar a backend |
| --- | --- | --- | --- |
| Settings | `frontend/src/data/localStorage/appSettingsRepository.ts` | Persistencia de moneda, idioma, tema, perfil, `pinHash`, migración v1->v2 | Sí, si hay usuario/auth/perfil real. Tema/idioma pueden cachearse localmente. |
| Accounts | `frontend/src/data/localStorage/accountsRepository.ts` | CRUD de cuentas, migraciones, default account, delete cascade manual sobre transacciones | Sí. Es entidad core. |
| Categories | `frontend/src/data/localStorage/categoriesRepository.ts` | CRUD de categorías/subcategorías, protected categories | Sí. Es catálogo de dominio. |
| Transactions | `frontend/src/data/localStorage/transactionsRepository.ts` | CRUD, migraciones v1-v4, normalización de fechas/meta, auto-link con goals | Sí. Es entidad financiera core. |
| Budgets | `frontend/src/data/localStorage/budgetsRepository.ts` | CRUD, migración v1-v2, scope rules, validación de mes/monto | Sí. Reglas e integridad de presupuesto deben ser server-side. |
| Goals | `frontend/src/data/localStorage/goalsRepository.ts` | CRUD, uniqueness, sync con categorías/subcategorías, eliminación de categorías legacy | Sí. Relación Goal-Categoría debe ser transaccional. |
| Cuotas | `frontend/src/data/localStorage/cuotasRepository.ts` | CRUD, cálculo de cuotas, creación de cuenta/categoría tarjeta, generación automática de transacciones | Sí, alta prioridad. Tiene side effects financieros. |
| Investments | `frontend/src/data/localStorage/investmentsPortfolioRepository.ts` | CRUD de posiciones, entradas, snapshots, refs diarios/mensuales, migración legacy | Sí, alta prioridad si las inversiones serán persistentes. |

### 4.2 Problema de fondo

Los repositorios locales implementan interfaces de dominio, lo cual ayuda al desacople, pero la implementación actual usa `window.localStorage` y mutaciones cross-domain dentro del navegador.

Esto provoca:

- Sin persistencia multi-dispositivo.
- Sin modelo de usuario real.
- Sin control de concurrencia.
- Sin transacciones atómicas entre entidades.
- Sin auditoría de cambios financieros.
- Sin garantía de integridad si falla una operación intermedia.
- Sin privacidad/seguridad fuerte para datos financieros.

## 5. Reglas de negocio actualmente en frontend que deberían ser backend

### 5.1 Integridad entre cuentas y transacciones

Archivo: `frontend/src/data/localStorage/accountsRepository.ts`

Hallazgo:

- Al eliminar una cuenta, `accountsRepository.remove` elimina también transacciones asociadas manipulando directamente el payload `clocket.transactions`.
- Esto es un cascade delete manual desde frontend.

Riesgo:

- Si el schema de transacciones cambia, este cascade puede romperse silenciosamente.
- Si una futura API falla parcialmente, se puede borrar una cuenta sin borrar transacciones o viceversa.
- No hay soft delete ni auditoría.

Recomendación backend:

- Modelar `Account -> Transaction` con política explícita:
  - `ON DELETE RESTRICT` si hay transacciones.
  - o soft delete de cuenta.
  - o cascade transaccional controlado.
- Exponer endpoint tipo `DELETE /accounts/:id` con comportamiento documentado.

### 5.2 Goals sincroniza categorías y subcategorías

Archivo: `frontend/src/data/localStorage/goalsRepository.ts`

Hallazgo:

- Crear/editar/eliminar goals muta categorías.
- Hay lógica para asegurar categoría padre `Goals`, crear subcategorías por goal, consolidar duplicados y remover categorías legacy.

Riesgo:

- Es una operación multi-entidad no transaccional.
- Si falla la actualización de categoría luego de crear goal, el estado queda inconsistente.
- La relación goal/subcategoría está implícita en strings, no en una relación persistente.

Recomendación backend:

- Modelar explícitamente `Goal` y su relación con `Category/Subcategory`.
- Resolver si `Goal` debe depender de categorías o si categorías son solo una vista de clasificación.
- Crear servicio transaccional `GoalService.createGoal()`.

### 5.3 Cuotas genera entidades financieras automáticamente

Archivo: `frontend/src/data/localStorage/cuotasRepository.ts`

Hallazgo:

- Asegura categoría `Tarjeta de Credito`.
- Asegura cuenta `Tarjeta de Credito`.
- Genera transacciones de cuotas pagadas.
- Actualiza transacciones existentes si cambia la cuenta.
- Elimina transacciones asociadas al plan.
- Calcula fechas de cuotas y bloquea fechas futuras.

Riesgo:

- Es probablemente el flujo con mayor necesidad de backend.
- Genera efectos colaterales financieros en varias entidades.
- Puede duplicar o desincronizar transacciones si hay fallas intermedias.

Recomendación backend:

- Crear un servicio transaccional `InstallmentPlanService`.
- Endpoint sugerido:
  - `POST /installment-plans`
  - `PATCH /installment-plans/:id`
  - `DELETE /installment-plans/:id`
  - `POST /installment-plans/:id/sync-transactions`
- Definir si las transacciones generadas son materializadas o derivadas.

### 5.4 Investments mezcla portfolio, snapshots, refs y transacciones

Archivos:

- `frontend/src/data/localStorage/investmentsPortfolioRepository.ts`
- `frontend/src/domain/investments/refreshPositions.ts`
- `frontend/src/hooks/useInvestmentsPageModel.ts`

Hallazgo:

- El frontend mantiene posiciones, entradas, snapshots de cotización y referencias diarias/mensuales.
- `refreshPositions` decide cuándo refrescar precios, aplica cooldowns, guarda snapshots y actualiza refs.
- `useInvestmentsPageModel` crea categorías/subcategorías para inversiones y crea transacciones relacionadas a compras/ventas.

Riesgo:

- El refresh de cotizaciones y persistencia de snapshots debería ser backend para evitar duplicación entre clientes.
- Los cooldowns en memoria (`assetRecentFailureCache`) son por pestaña/browser, no globales.
- Compra/venta de inversión genera impactos en categorías/transacciones desde UI.

Recomendación backend:

- Mover a backend:
  - persistencia de positions/entries/snapshots/refs;
  - refresh orchestration;
  - deduplicación por asset;
  - cooldowns/provider throttling;
  - generación de transacción asociada a inversión, si aplica.
- Mantener en frontend solo view model y UI de formulario.

### 5.5 Budgets y scope rules

Archivos:

- `frontend/src/data/localStorage/budgetsRepository.ts`
- `frontend/src/domain/budgets/budgetScopeMatcher.ts`
- `frontend/src/hooks/useBudgetsPageModel.ts`

Hallazgo:

- Los budgets guardan reglas de alcance por categoría/subcategoría.
- Hay lógica para normalizar reglas, detectar overlaps y matchear transacciones.

Riesgo:

- La prevención de budgets solapados debería ser regla canónica server-side.
- Si varios clientes crean budgets en paralelo, localStorage no puede asegurar integridad.

Recomendación backend:

- Crear endpoint con validación transaccional para `BudgetScopeRule`.
- Considerar constraint lógico: no permitir solapamientos por mes/categoría/subcategoría.

### 5.6 Transactions tiene normalización y auto-link con goals

Archivo: `frontend/src/data/localStorage/transactionsRepository.ts`

Hallazgo:

- Migra payloads v1-v4.
- Normaliza fechas desde `date`, `createdAt` o `meta`.
- Mantiene `meta` con prefijo de fecha.
- Auto-linkea transacciones a goals según categoría/subcategoría.
- Emite evento `TRANSACTIONS_CHANGED_EVENT` para sync local.

Riesgo:

- Reglas de clasificación y link a goals son reglas de dominio.
- El uso de `meta` como portador semiestructurado de fecha no debería ser parte del modelo persistente futuro.

Recomendación backend:

- Separar campos reales: `date`, `description`, `notes`, `source`, `goalId`, `categoryId`, `subcategoryId`.
- Evitar parsear datos estructurados desde strings.

## 6. Seguridad y perfil de usuario en frontend

### 6.1 PIN local no es seguridad fuerte

Archivos:

- `frontend/src/utils/securityPin.ts`
- `frontend/src/data/localStorage/appSettingsRepository.ts`

Hallazgo:

- El PIN se valida como 4 dígitos.
- Se hashea con SHA-256 vía `crypto.subtle`; fallback a hash simple local.
- El hash queda en `localStorage` dentro de settings.

Riesgo:

- SHA-256 sin salt ni KDF no protege adecuadamente un PIN de 4 dígitos.
- El fallback `fallbackHash` no es criptográficamente seguro.
- Todo el mecanismo vive en el cliente; no debe considerarse autenticación real.

Recomendación backend:

- Si se requiere seguridad real: auth backend + sesión + almacenamiento server-side.
- Si se requiere modo offline/local-only: cifrado local con WebCrypto, salt, KDF fuerte y threat model explícito.
- No reutilizar el PIN actual como credencial backend.

## 7. Export/import y backup

Archivo: `frontend/src/utils/settingsExport.ts`

Hallazgo:

- El frontend arma un snapshot completo leyendo todos los repositorios locales.
- Exporta JSON y CSV de transacciones desde el navegador.

Riesgo:

- Está bien para local-first, pero si hay backend real, el backup debe salir desde una fuente canónica.
- No hay import validado, versionado global o checksum.

Recomendación backend:

- Crear endpoints:
  - `GET /export` para backup autenticado.
  - `POST /import` con dry-run/validación.
  - `GET /transactions.csv` si se mantiene CSV.

## 8. Market quote client: duplicación de contrato con backend

Archivo: `frontend/src/data/http/marketQuoteApiClient.ts`

Hallazgo:

- El frontend define `MarketQuoteApiResult`, `MarketQuoteApiError`, normaliza payloads y mapea errores HTTP/provider.
- Backend define su propia forma de respuesta/error.
- Frontend espera `code` y crea `staleWarning`; backend devuelve `error`, `code`, `details`, pero no `status` ni `staleWarning`.

Riesgo:

- Contrato API implícito y duplicado.
- Cambios backend pueden romper frontend sin typecheck compartido.

Recomendación backend:

- Crear contrato compartido o schemas:
  - `MarketQuoteResponse`.
  - `MarketQuoteErrorResponse`.
- Ideal: paquete compartido `shared/` o schemas Zod/Valibot exportados a frontend y backend.
- Documentar OpenAPI.

## 9. Analytics/statistics: qué mover y qué no

Archivo principal: `frontend/src/hooks/useStatisticsPageModel.ts`

Hallazgo:

- Construye balances mensuales, categorías, flujos por día/semana/mes y progreso de metas.
- Usa datos ya cargados en cliente.

Evaluación:

- Puede permanecer frontend si es solo visual y dataset pequeño.
- Debería pasar a backend si:
  - hay muchos datos;
  - se requiere consistencia multi-dispositivo;
  - se quiere dashboard server-side;
  - se necesita reporting auditable.

Recomendación backend:

- Fase 1: mover persistencia primero.
- Fase 2: endpoints agregados:
  - `GET /analytics/monthly-balance`
  - `GET /analytics/category-breakdown`
  - `GET /analytics/cash-flow`
  - `GET /analytics/goals-progress`

## 10. Código frontend que puede quedarse en frontend

No todo debe migrar. Se recomienda mantener en frontend:

- Componentes UI y widgets.
- Page models que orquestan formularios y estados visuales, siempre que llamen APIs en vez de repositorios locales.
- Formatting de moneda/porcentaje para presentación.
- Interacciones táctiles, carousels, pull-to-refresh, modals.
- Caches de UI y optimizaciones de render.
- Estado temporal de formularios.

## 11. Mapa de migración recomendado desde frontend

| Prioridad | Área | Qué mover primero | Motivo |
| --- | --- | --- | --- |
| P0 | Contratos API | Tipos/schemas compartidos para quote y errores | Evita romper integración actual. |
| P1 | Transactions + Accounts | Persistencia, CRUD, constraints, cascade policy | Núcleo financiero. |
| P1 | Categories | Catálogo y subcategorías | Es dependencia de transacciones, budgets, goals, cuotas, inversiones. |
| P1 | Budgets | CRUD + overlap validation | Reglas de integridad. |
| P1 | Goals | CRUD + relación con transacciones/categorías | Reglas multi-entidad. |
| P1 | Cuotas | Planes + generación de transacciones | Side effects críticos. |
| P2 | Investments | Positions/entries/snapshots/refs | Persistencia financiera + provider refresh. |
| P2 | Market quote orchestration | Refresh/cooldown/cache/snapshots | Evita duplicación y throttling por cliente. |
| P3 | Settings/profile/security | Usuario, preferencias, auth o cifrado | Requiere decisión de producto. |
| P4 | Analytics/export | Dashboards y backup server-side | Mejor después de tener DB. |

---

# Frente 2 — Audit del backend actual

## 12. Estructura actual de `backend/`

```text
backend/
  .env.example
  README.md
  next.config.js
  package.json
  package-lock.json
  lib/
    alphaVantageClient.js
  pages/
    index.js
    api/
      hello.js
      market/
        quote.js
```

## 13. Capacidades reales actuales

### 13.1 Endpoint real: `GET /api/market/quote`

Archivo: `backend/pages/api/market/quote.js`

Responsabilidades:

- Acepta solo método `GET`.
- Valida `assetType` como `stock` o `crypto`.
- Normaliza `ticker` a uppercase.
- Valida ticker con regex `^[A-Z][A-Z0-9.-]{0,14}$`.
- Lee `ALPHA_VANTAGE_API_KEY` desde `process.env`.
- Llama a:
  - `fetchStockQuote(ticker, apiKey)`.
  - `fetchCryptoRate(ticker, apiKey)`.
- Devuelve status `200` con quote y `asOf` server-side.
- Mapea `AlphaVantageClientError` a status/error/code/details.
- Mapea errores no controlados a `502`.

### 13.2 Cliente Alpha Vantage

Archivo: `backend/lib/alphaVantageClient.js`

Responsabilidades:

- Usa Axios con `baseURL=https://www.alphavantage.co/query`.
- Timeout hardcodeado: `12_000` ms.
- Reintento máximo: `1`.
- Queue global en memoria con intervalo mínimo de `1_100` ms entre requests.
- Detecta payloads de throttling en `Information` y `Note`.
- Detecta `Error Message` como símbolo inválido.
- Parsea `GLOBAL_QUOTE` para stocks.
- Parsea `CURRENCY_EXCHANGE_RATE` para crypto.
- Normaliza precio, bid, ask y porcentaje diario.

### 13.3 Endpoints/placeholders no productivos

| Archivo | Estado | Recomendación |
| --- | --- | --- |
| `backend/pages/api/hello.js` | Placeholder de scaffold | Eliminar o reemplazar por `/api/health`. |
| `backend/pages/index.js` | Página HTML mínima de backend | Eliminar si API-only o reemplazar por health/status simple. |

## 14. Brechas principales del backend actual

### 14.1 No hay TypeScript

Impacto:

- Contratos del provider y de la API están implícitos.
- Frontend TypeScript no puede verificar compatibilidad con backend.
- Más riesgo al refactorizar parser de Alpha Vantage.

Recomendación:

- Migrar backend a TypeScript antes o durante la reestructura.
- Definir tipos para:
  - request query;
  - response success;
  - response error;
  - payload bruto Alpha Vantage;
  - error interno de provider.

### 14.2 No hay tests backend

Evidencia:

- No existen `*.test.js`, `*.test.ts`, `*.spec.js` ni `*.spec.ts` en `backend/`.
- `backend/package.json` no tiene script `test`.

Recomendación mínima previa a reestructura:

- Tests unitarios para `alphaVantageClient`.
- Tests de handler para `/api/market/quote`.
- Casos mínimos:
  - método no permitido;
  - `assetType` inválido;
  - ticker inválido;
  - API key faltante;
  - éxito stock;
  - éxito crypto;
  - throttling `Information`/`Note`;
  - `Error Message`;
  - payload faltante;
  - timeout/network error;
  - retry de status transitorios.

### 14.3 Env var documentada pero no usada

Archivo: `backend/.env.example`

Hallazgo:

- Documenta `ALPHA_VANTAGE_TIMEOUT_MS=12000`.
- El código usa `REQUEST_TIMEOUT_MS = 12_000` hardcodeado.

Recomendación:

- O eliminar `ALPHA_VANTAGE_TIMEOUT_MS` del example.
- O implementar lectura validada de env.

### 14.4 Rate limiting no durable

Archivo: `backend/lib/alphaVantageClient.js`

Hallazgo:

- `providerQueue` y `lastProviderRequestAt` viven en memoria del proceso.

Riesgo:

- En serverless/múltiples instancias no hay coordinación.
- Al reiniciar proceso se pierde estado.
- No hay rate limit por usuario/IP/asset.

Recomendación:

- Para backend simple single-process puede mantenerse temporalmente.
- Para producción: cache/rate limit externo o DB/Redis.
- Agregar cache por ticker/asset con TTL.

### 14.5 No hay cache de cotizaciones en backend

Hallazgo:

- Cada request válido puede llamar provider salvo throttling secuencial.
- El frontend guarda snapshots localmente, pero backend no comparte resultados entre clientes.

Riesgo:

- Alta probabilidad de throttling de Alpha Vantage.
- Cada navegador resuelve su propio estado.

Recomendación:

- Crear cache backend por `assetType:ticker`.
- TTL sugerido:
  - stock: 5-15 min para UI normal;
  - crypto: 1-5 min si se quiere más fresco;
  - fallback a último snapshot persistido.

### 14.6 Contrato de errores incompleto

Backend actual devuelve:

```json
{
  "error": "...",
  "code": "...",
  "details": "..."
}
```

Frontend deriva:

```ts
code
status
staleWarning
```

Riesgo:

- El contrato no es simétrico.
- `status` y `staleWarning` son conocimiento del frontend, no de la API.

Recomendación:

- Respuesta error canónica:

```json
{
  "error": "Alpha Vantage rate limit exceeded.",
  "code": "THROTTLED",
  "status": 429,
  "retryable": false,
  "details": "...",
  "stalePolicy": "KEEP_LAST_SNAPSHOT"
}
```

### 14.7 No hay observabilidad

Hallazgo:

- No hay logging estructurado.
- No hay request id.
- No hay métricas de provider: latencia, throttles, errores, cache hits/misses.

Recomendación:

- Agregar logger mínimo.
- Loggear sin exponer API keys.
- Métricas sugeridas:
  - `market_quote_request_total`;
  - `market_quote_provider_error_total`;
  - `market_quote_cache_hit_total`;
  - `market_quote_latency_ms`.

### 14.8 API-only usando Next.js + React

Hallazgo:

- El backend usa Next.js Pages Router.
- Tiene `react`/`react-dom` porque existe `pages/index.js`.
- Si se elimina la página y se mantiene Next API Routes, Next puede seguir requiriendo dependencias del framework.

Evaluación:

- Next.js está bien si se planea full-stack o se quiere mantener API routes.
- Para API-only liviano, Hono/Fastify/Express sería más simple.

Recomendación:

- Decidir explícitamente:
  - **API-only recomendado:** Hono o Fastify con TypeScript.
  - **Mantener Next:** solo si se quiere desplegar junto al frontend en plataforma compatible o evolucionar a full-stack.

### 14.9 No hay persistencia ni modelo de dominio

El backend no contiene:

- DB.
- Migrations.
- Models.
- Repositories.
- Services de dominio.
- Auth/users.
- Multi-tenancy.
- Export/import.

Esto no es un bug para el estado actual, pero sí define el alcance real: el backend actual es un provider adapter, no el backend de Clocket.

## 15. Inventario de endpoints backend actuales

| Endpoint | Método | Estado | Acción recomendada |
| --- | --- | --- | --- |
| `/api/market/quote?assetType=stock&ticker=AAPL` | GET | Productivo | Mantener, tipar, testear, cachear. |
| `/api/market/quote?assetType=crypto&ticker=BTC` | GET | Productivo | Mantener, tipar, testear, cachear. |
| `/api/hello` | GET | Scaffold | Eliminar o convertir en `/api/health`. |
| `/` | GET | Scaffold UI | Eliminar si API-only. |

## 16. Contrato actual observado para market quotes

### 16.1 Success response actual

Campos retornados por backend:

```ts
{
  assetType: "stock" | "crypto";
  ticker: string;
  currentPrice: number;
  source: "GLOBAL_QUOTE" | "CURRENCY_EXCHANGE_RATE";
  dailyPctFromProvider: number | null;
  lastRefreshed: string | null;
  timezone: string | null;
  bid: number | null;
  ask: number | null;
  asOf: string;
}
```

### 16.2 Error codes actuales

| Code | Origen | HTTP actual | Significado |
| --- | --- | --- | --- |
| `THROTTLED` | Alpha Vantage `Information`/`Note` | 429 | Rate limit provider. |
| `INVALID_SYMBOL` | Alpha Vantage `Error Message` o payload vacío | 422 | Símbolo inválido/no soportado. |
| `PARSE_ERROR` | Payload inesperado | 502 | Provider respondió forma no parseable. |
| `HTTP_ERROR` | Axios con response | status provider | Error HTTP provider. |
| `NETWORK_ERROR` | Axios sin response | 502 | Timeout/red. |
| `UNKNOWN` | Fallback | 502 | Error no clasificado. |
| `RETRY_EXHAUSTED` | Fallback post-loop | 502 | Presupuesto de retry agotado. |

## 17. Riesgos del backend actual

| Riesgo | Severidad | Detalle |
| --- | --- | --- |
| Sin tests backend | Alta | Reestructura puede romper provider parsing sin señal. |
| Sin TypeScript/schemas | Alta | Contratos implícitos y duplicados con frontend. |
| Rate limit en memoria | Media/Alta | No sirve para múltiples instancias/serverless. |
| Sin cache backend | Media/Alta | Alpha Vantage puede throttlear rápidamente. |
| Env `ALPHA_VANTAGE_TIMEOUT_MS` no usada | Baja/Media | Config documentada engañosa. |
| Endpoint `/api/hello` scaffold | Baja | Ruido de proyecto. |
| Página `/` scaffold | Baja | Obliga mentalidad de app Next aunque es API-only. |
| Sin observabilidad | Media | Difícil diagnosticar errores provider. |
| Sin auth/persistencia | Alta para backend real | No soporta producto financiero multiusuario. |

---

# 18. Recomendación de arquitectura destino

## 18.1 Dirección recomendada

Para el estado actual, la opción más limpia es:

**Backend API-only en TypeScript** con capas explícitas:

```text
backend/
  src/
    config/
    http/
      routes/
      middleware/
    modules/
      market/
      accounts/
      categories/
      transactions/
      budgets/
      goals/
      cuotas/
      investments/
      settings/
      analytics/
    shared/
      errors/
      schemas/
      types/
    persistence/
      db/
      migrations/
      repositories/
    providers/
      alpha-vantage/
    tests/
```

Framework sugerido si se abandona Next.js:

- **Hono** si se quiere API liviana, edge-friendly y simple.
- **Fastify** si se quiere ecosistema Node robusto, plugins y validación.

Framework sugerido si se mantiene Next.js:

- Migrar `pages/api` a TypeScript.
- Extraer lógica a `backend/src/modules/*` para no acoplar dominio a handlers.

## 18.2 Capas mínimas recomendadas

| Capa | Responsabilidad |
| --- | --- |
| Route/Handler | HTTP, query/body parsing, response status. |
| Schema/Contract | Validación runtime y tipos compartidos. |
| Service | Reglas de negocio y transacciones multi-entidad. |
| Repository | DB access. |
| Provider Adapter | Alpha Vantage u otros externos. |
| Error Mapper | Error interno -> respuesta API. |

## 18.3 Endpoints candidatos para backend real

### Core

- `GET /health`
- `GET /accounts`
- `POST /accounts`
- `PATCH /accounts/:id`
- `DELETE /accounts/:id`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- `GET /transactions`
- `POST /transactions`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`

### Domain features

- `GET /budgets`
- `POST /budgets`
- `PATCH /budgets/:id`
- `DELETE /budgets/:id`
- `GET /goals`
- `POST /goals`
- `PATCH /goals/:id`
- `DELETE /goals/:id`
- `GET /installment-plans`
- `POST /installment-plans`
- `PATCH /installment-plans/:id`
- `DELETE /installment-plans/:id`
- `POST /installment-plans/:id/sync-transactions`
- `GET /investments/positions`
- `POST /investments/entries`
- `DELETE /investments/entries/:id`
- `POST /investments/refresh`
- `GET /market/quote`

### Utility/reporting

- `GET /analytics/monthly-balance`
- `GET /analytics/category-breakdown`
- `GET /analytics/cash-flow`
- `GET /export`
- `POST /import/dry-run`
- `POST /import`

## 19. Orden recomendado antes de reestructurar

### Paso 1 — Congelar contrato actual de market quotes

- Crear schemas/tipos compartidos.
- Agregar tests backend para endpoint y provider.
- Corregir `ALPHA_VANTAGE_TIMEOUT_MS`.
- Definir respuesta error canónica.

### Paso 2 — Decidir backend framework y runtime

Decisión requerida:

- Mantener Next.js API Routes.
- O migrar a Hono/Fastify.

Criterios:

- Si backend será API-only: preferir Hono/Fastify.
- Si se quiere full-stack Next: migrar todo a Next, incluyendo frontend.
- Si se quiere menor riesgo inmediato: mantener Next pero extraer servicios TypeScript.

### Paso 3 — Definir persistencia

Decisión requerida:

- SQLite local.
- Postgres/Supabase.
- Otro.

Para producto financiero multi-dispositivo, Postgres/Supabase tiene mejor proyección.

### Paso 4 — Migrar primero entidades core

Orden sugerido:

1. Accounts.
2. Categories.
3. Transactions.
4. Budgets.
5. Goals.
6. Cuotas.
7. Investments.
8. Analytics/export.

### Paso 5 — Cambiar frontend de repositorios locales a API clients

Mantener interfaces de dominio puede ayudar:

- Reemplazar `LocalStorage*Repository` por `Http*Repository`.
- Mantener localStorage solo como cache/offline si se decide explícitamente.

## 20. Qué limpiar del proyecto durante reestructura

### Backend

- Eliminar `/api/hello` o convertir a `/health`.
- Eliminar `pages/index.js` si backend queda API-only.
- Migrar JS a TS.
- Agregar `test`, `typecheck`, `lint` en `backend/package.json`.
- Agregar tests de provider y handlers.
- Agregar validación de env.
- Agregar capa `src/` y mover `lib/alphaVantageClient.js`.

### Frontend

- Eliminar imports directos a `@/data/localStorage` desde hooks/page models cuando exista API.
- Mantener `domain/*/repository.ts` como contratos si ayudan a transición.
- Mover migraciones localStorage a scripts de import/migration backend.
- Reducir duplicación de normalizadores entre frontend/backend.
- Mantener solo adapters de UI, no reglas canónicas.

## 21. Decisiones abiertas

1. ¿El producto seguirá soportando modo offline/local-first?
2. ¿Habrá usuarios y autenticación?
3. ¿La DB será local, cloud o ambas?
4. ¿Se quiere mantener Next.js o ir a API-only?
5. ¿Las transacciones generadas por cuotas/inversiones son materializadas o derivadas?
6. ¿Categorías/subcategorías son catálogo editable por usuario o parte de reglas internas?
7. ¿Qué nivel de auditoría financiera se necesita?
8. ¿El PIN actual se elimina, se convierte en auth real o se usa para cifrado local?

## 22. Conclusión

El backend actual debe verse como una primera integración externa, no como base completa de dominio. El mayor trabajo previo a una reestructura es extraer reglas y contratos del frontend, especialmente en repositorios `localStorage` y flujos cross-domain.

La ruta más segura es:

1. Tipar y testear el backend actual.
2. Formalizar contratos compartidos.
3. Decidir framework + DB.
4. Migrar entidades core desde frontend hacia backend por etapas.
5. Reemplazar repositorios locales por repositorios HTTP.

No se recomienda iniciar por una reescritura total sin antes congelar contratos y cubrir con tests el comportamiento actual de market quotes y reglas financieras críticas.
