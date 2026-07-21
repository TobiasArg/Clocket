# Clocket App — Monorepo

Monorepo de finanzas personales con dos aplicaciones:

- `frontend` — Vite + React + TypeScript, puerto `5173`.
- `backend` — Next.js API Routes + Prisma/PostgreSQL, puerto `3001`.

## Desarrollo nativo

Cada entorno se levanta por separado. `npm --prefix frontend run dev` ya no inicia el backend.

### Instalar dependencias

```bash
npm --prefix backend install
npm --prefix frontend install
```

### Base de datos local

```bash
npm run db:up
npm run db:migrate
```

`db:up` levanta PostgreSQL desde `compose.yaml` en `127.0.0.1:5433`. `db:migrate` aplica migraciones existentes con `prisma migrate deploy`.

### Levantar apps separadas

```bash
npm run dev:backend
npm run dev:frontend
```

`dev:backend` levanta PostgreSQL local si hace falta, aplica migraciones existentes y luego inicia Next.js en `3001`. El script propio del backend solo genera Prisma Client e inicia Next.

También se puede ejecutar desde cada carpeta:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

### Levantar ambas apps desde raíz

```bash
npm run dev
```

Este comando solo orquesta procesos; el frontend y backend siguen teniendo scripts independientes.

## Desarrollo con Docker

Levanta PostgreSQL, aplica migraciones existentes, backend y frontend:

```bash
npm run docker:up
```

Servicios publicados:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:3001`
- PostgreSQL: `127.0.0.1:5433`

Para crear/aplicar nuevas migraciones durante desarrollo:

```bash
npm run docker:migrate
```

Para apagar el stack:

```bash
npm run docker:down
```

## Variables de entorno

- Backend: copiar `backend/.env.example` a `backend/.env` para desarrollo nativo.
- Frontend: `VITE_API_PROXY_TARGET` es opcional y por defecto apunta a `http://127.0.0.1:3001`.
- Los scripts raíz `db:*`, `dev` y `dev:backend` fuerzan la `DATABASE_URL` local para evitar aplicar migraciones accidentalmente sobre una DB remota configurada en `backend/.env`.
- Docker sobreescribe `DATABASE_URL`, `DIRECT_URL` y `VITE_API_PROXY_TARGET` para usar la red interna de Compose. No se versionan API keys en Compose.

## Validación

```bash
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix backend run build
```

## Herramientas de asistentes

Las skills compartidas del proyecto viven en `.agents/skills/` y se versionan
junto con el código. Kiro las consume mediante enlaces en `.kiro/skills/`;
Codex y OpenCode mantienen sus adaptadores OpenSpec en `.codex/` y `.opencode/`.

Para preparar OpenCode en una clonación nueva:

```bash
npm --prefix .opencode ci
```

No se versionan dependencias instaladas, caches ni configuración personal de
asistentes. La política de mantenimiento completa está en `AGENTS.md`.

## Flujo global seguro para agentes Codex

Inicio de tarea (crea rama `codex/<english-kebab>` y worktree aislado):

```bash
~/.codex/tools/codex-task-start.sh "improve investments ui" --parent origin/main
```

Cierre de tarea (solo post-merge, cleanup seguro + self-delete del thread):

```bash
~/.codex/tools/codex-task-finish.sh --branch codex/improve-investments-ui --parent origin/main --yes
```

Ese cierre ahora también aplica preflight fail-fast de self-destruction antes de mutar Git y scrub residual seguro en `~/.codex` (JSONL remanentes, backups de state y carpetas vacías de worktrees).

Validación sin mutar:

```bash
~/.codex/tools/codex-task-finish.sh --branch codex/improve-investments-ui --parent origin/main --dry-run
```
