# Agent Execution Rules (Repository Scope)

These rules apply to all Codex agents/threads working in this repository.

<!-- CODEX_GLOBAL_POLICY_START -->

## Scope and Mandatory Read

Este `AGENTS.md` aplica a todo el repositorio salvo que un `AGENTS.md` mas especifico lo sobreescriba.
Debe leerse completo antes de ejecutar cualquier tarea.

## Rule Precedence

Cuando exista conflicto entre reglas, aplicar este orden:

1. Instrucciones activas de la sesion (`system`, `developer`, `user`).
2. `AGENTS.md` mas cercano al archivo o carpeta en la que se trabaja.
3. `AGENTS.md` de directorios padres intermedios.
4. `AGENTS.md` raiz del repositorio.

Regla de desempate: mientras mas especifico (mas interno al dominio o carpeta), mayor prioridad.

Ejemplo practico:
- Si `frontend/AGENTS.md` permite una convencion general, pero `frontend/src/modules/investments/AGENTS.md` define una regla distinta para inversiones, se aplica la de `modules/investments` al tocar ese modulo.

## Agents Document Set (Current)

- `ProductOrientedAgents.md`
- `TecnicalAgents.md`
- `TestingValidationAgents.md`

## Skills (Mandatory Catalog)

Todas las tareas deben evaluar skills aplicables antes de implementar.

| Skill | Description | Skill File |
| --- | --- | --- |
| `find-skills` | Descubre e identifica skills cuando se busca capacidad nueva o extension funcional. | `/Users/argtobias/.agents/skills/find-skills/SKILL.md` |
| `gh-fix-ci` | Investiga y corrige fallas en checks de GitHub Actions en PRs. | `/Users/argtobias/.codex/skills/gh-fix-ci/SKILL.md` |
| `pdf` | Lectura, generacion y revision de PDFs con foco en rendering y layout. | `/Users/argtobias/.codex/skills/pdf/SKILL.md` |
| `sdoat-codex` | Flujo autonomo de trabajo agentico de punta a punta (branch/worktree/merge/cleanup). | `/Users/argtobias/.codex/skills/sdoat-codex/SKILL.md` |
| `vercel-react-best-practices` | Buenas practicas de performance para React/Next.js segun Vercel Engineering. | `/Users/argtobias/.agents/skills/vercel-react-best-practices/SKILL.md` |
| `skill-creator` | Guia para crear o actualizar skills de forma efectiva. | `/Users/argtobias/.codex/skills/.system/skill-creator/SKILL.md` |
| `skill-installer` | Instalacion de skills curadas o desde rutas/repos. | `/Users/argtobias/.codex/skills/.system/skill-installer/SKILL.md` |

### Skill Invocation Policy

Mandatory task classification before implementation:

1. Clasificar el tipo de tarea (discovery, CI fix, PDF, React/Next performance, skill authoring, skill install, autonomous flow).
2. Identificar todas las skills relevantes para ese tipo de tarea.
3. Auto-invocar primero todas las skills necesarias antes de editar codigo o documentos.
4. Si aplican multiples skills, ejecutarlas en orden de impacto para la tarea actual.

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
| --- | --- |
| Buscar capacidades o skills disponibles | `find-skills` |
| Instalar una skill curada o desde un repo/ruta | `skill-installer` |
| Crear o actualizar una skill | `skill-creator` |
| Investigar y corregir CI de GitHub Actions | `gh-fix-ci` |
| Leer, generar o revisar PDFs | `pdf` |
| Refactor/performance en React, Vite o Next.js | `vercel-react-best-practices` |
| Ejecutar flujo autonomo task->merge->cleanup | `sdoat-codex` |

Fallback obligatorio:
- Si la skill requerida no esta disponible o no puede leerse, reportar el bloqueo de forma explicita y continuar con la mejor alternativa documentada.

## Project Overview

Clocket es un monorepo de finanzas personales con dos aplicaciones principales:

- `frontend`: Vite + React + TypeScript + Tailwind CSS v4.
- `backend`: Next.js (API Routes) para endpoints internos y adaptacion de proveedores.

Integracion principal:
- El frontend consume `/api` y en desarrollo lo proxea a `http://127.0.0.1:3001`.

Dominio funcional actual:
- cuentas
- transacciones
- presupuestos
- metas
- cuotas
- inversiones
- estadisticas
- settings

## Repository Structure

### A) Root Structure

| Path | Purpose |
| --- | --- |
| `.github/workflows/` | CI/CD (incluye chequeos automatizados como bundle budget de frontend). |
| `frontend/` | Aplicacion cliente (UI, routing, estado, dominio frontend). |
| `backend/` | API Routes y adaptadores de proveedores externos. |
| `scripts/` | Scripts operativos del repositorio (incluye wrappers de limpieza de worktree). |
| `ProductOrientedAgents.md` | Reglas de producto, marca y UX. |
| `TecnicalAgents.md` | Reglas tecnicas y de implementacion. |
| `TestingValidationAgents.md` | Reglas de testing, validaciones y evidencia obligatoria en PR. |
| `AGENTS.md` | Orquestador global de reglas agenticas del repo. |

### B) Frontend `src/` Structure by Layer

| Path | Purpose |
| --- | --- |
| `frontend/src/components/` | Componentes de UI reutilizables y widgets. |
| `frontend/src/pages/` | Pantallas por ruta (composicion de features). |
| `frontend/src/router/` | Tipos de rutas, logica de navegacion y route switch (`AppRouter`). |
| `frontend/src/hooks/` | Orquestacion de estado, casos de uso y page models. |
| `frontend/src/modules/` | API de features por dominio (re-export y composicion). |
| `frontend/src/domain/` | Contratos y reglas de negocio del dominio. |
| `frontend/src/data/` | Infraestructura y repositorios (`localStorage`, `http`). |
| `frontend/src/constants/` | Constantes compartidas. |
| `frontend/src/utils/` | Utilidades transversales y helpers. |
| `frontend/src/types/` | Tipos de UI y contratos compartidos de frontend. |
| `frontend/src/context/` | Providers/contextos globales de React. |
| `frontend/src/globals.css` | Estilos globales base de la aplicacion. |
| `frontend/src/services/` | Carpeta actualmente vacia; reservada para transicion o integraciones futuras. No crear codigo nuevo aqui sin decision explicita de arquitectura. |
| `frontend/src/styles 12-01-36-379/` | Carpeta anomala vacia detectada. No usar para nuevas implementaciones. |

Flujo de dependencias recomendado:
- `data -> domain -> hooks/modules -> pages/components -> router/App`

Regla de arquitectura:
- Evitar saltar capas sin justificacion tecnica explicita en la PR.

### C) Backend Structure

| Path | Purpose |
| --- | --- |
| `backend/pages/api/**` | Endpoints HTTP (API Routes de Next.js). |
| `backend/lib/**` | Clientes/adaptadores externos (ejemplo: Alpha Vantage). |
| `backend/next.config.js` | Configuracion de Next.js del backend. |
| `backend/.env` | Variables de entorno locales (no versionar secretos). |
| `backend/.env.example` | Plantilla versionable de variables requeridas. |

## General Development Bases

- Reutilizar antes de crear nuevos componentes, hooks, tipos o repositorios.
- Mantener barrel exports donde ya existan (`index.ts` o equivalentes).
- Validar side effects y manejo de errores en IO (`localStorage`, red, proveedores externos).
- No introducir carpetas/capas nuevas sin justificarlo en la Pull Request.
- Mantener consistencia simultanea con:
  - `ProductOrientedAgents.md` (producto/UX)
  - `TecnicalAgents.md` (arquitectura/implementacion)
  - `TestingValidationAgents.md` (testing/validaciones)

## Branch Strategy (Target-Aware)

Politica oficial:
- Rama base por defecto: `origin/dev`.
- Excepcion: hotfix/release urgente sobre `origin/main`.
- Naming obligatorio de rama de trabajo: `codex/<english-kebab-task>`.

Ejemplos operativos:

```bash
# Sincronizar tracking local/remoto cuando sea necesario
./sync-branches.sh

# Inicio normal de trabajo sobre dev
git fetch --all --prune
git switch dev
git pull --ff-only origin dev
git switch -c codex/improve-transaction-editor

# Inicio de hotfix/release sobre main
git fetch --all --prune
git switch main
git pull --ff-only origin main
git switch -c codex/hotfix-market-quote-timeout
```

## Commit Guidelines (Mandatory)

Formato obligatorio (Conventional Commits):

`feat|fix|refactor|perf|docs|test|chore(scope): summary`

Scopes sugeridos:
- `frontend`
- `backend`
- `api`
- `domain`
- `data`
- `agents`
- `ci`

Reglas:
- Commits atomicos por cambio logico.
- Mensaje en modo imperativo, claro y tecnico.
- Incluir contexto minimo en el body cuando el cambio no sea obvio.
- Prohibido mezclar cambios no relacionados en un mismo commit.

Ejemplos:

```text
feat(frontend): add category quick-add validation
fix(api): handle alpha vantage throttling error payload
docs(agents): define skill invocation precedence
```

## Pull Request Guidelines (Mandatory Checklist)

Toda PR debe incluir:

- Objetivo y alcance del cambio.
- Riesgos/regresiones esperadas.
- Evidencia de validacion local segun area afectada.
- Capturas o GIF cuando haya cambios de UI.
- Confirmacion de compatibilidad con reglas de producto y tecnicas.
- Desvios estructurales explicitos (si existieran) y su justificacion.

Validaciones locales requeridas:

```bash
# Frontend
npm --prefix frontend test
npm --prefix frontend run build

# Backend
npm --prefix backend run build
```

Alineacion CI:
- Considerar el workflow `frontend-bundle-check.yml`, ejecutado en PRs y pushes a `main`/`dev` cuando hay cambios en `frontend/**`.

## Specialized AGENTS References

Referencias activas actuales:

- `/Users/argtobias/clocket-app/ProductOrientedAgents.md`
- `/Users/argtobias/clocket-app/TecnicalAgents.md`
- `/Users/argtobias/clocket-app/TestingValidationAgents.md`

Activacion de estos documentos:
- Solo aplican cuando existan fisicamente y siempre bajo la regla de especificidad definida en este archivo.
