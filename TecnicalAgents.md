# Technical Agents Rules (Clocket)

Este documento define reglas tecnicas obligatorias para trabajar en este repositorio.
Se usa junto con:

- `/Users/argtobias/clocket-app/AGENTS.md`
- `/Users/argtobias/clocket-app/ProductOrientedAgents.md`

Si hay conflicto, aplica la precedencia definida en `AGENTS.md`.

## 1. Pre-Work Checklist

Antes de editar codigo:

1. Leer `AGENTS.md` (gobernanza general).
2. Leer este archivo completo.
3. Leer `ProductOrientedAgents.md` si hay impacto de UI/UX/copy.
4. Revisar estructura real del area afectada (`frontend/src` o `backend`).
5. Buscar reutilizacion antes de crear archivos nuevos.
6. Verificar exports existentes (`index.ts`) antes de crear imports internos.

## 2. Monorepo Technical Baseline

Proyecto compuesto por:

- `frontend`: Vite + React + TypeScript + Tailwind v4.
- `backend`: Next.js API Routes (puerto 3001 en dev).

Integracion local:

- El frontend proxea `/api` a `http://127.0.0.1:3001`.
- Cotizaciones de mercado usan backend como adapter a Alpha Vantage.

## 3. Repository Structure (Source of Truth)

### 3.1 Root

- `.github/workflows/`: CI (incluye `frontend-bundle-check.yml`).
- `frontend/`: app cliente.
- `backend/`: API routes y providers.
- `scripts/`: scripts de soporte del repo.

### 3.2 Frontend (`frontend/src`)

- `components/`: UI reusable/widgets.
- `pages/`: screens por ruta.
- `router/`: path typing + navegacion + route mapping.
- `hooks/`: hooks de estado y page models.
- `modules/`: API de features por dominio (orquestacion/re-export).
- `domain/`: contratos y logica de negocio.
- `data/`: repositorios e infraestructura (`localStorage`, `http`).
- `constants/`, `utils/`, `types/`, `context/`, `globals.css`.
- `services/`: actualmente vacio (reservado; no usar por defecto).
- `styles 12-01-36-379/`: carpeta vacia anomala; no usar.

### 3.3 Backend

- `backend/pages/api/**`: endpoints.
- `backend/lib/**`: clientes/adaptadores externos.
- `backend/.env.example`: variables requeridas.

## 4. Architectural Rules

### 4.1 Dependency Flow

Usar este flujo como regla general:

`data -> domain -> hooks/modules -> pages/components -> router/App`

Reglas:

- Evitar dependencias circulares entre capas.
- Evitar acceso directo a infraestructura desde componentes de UI si ya existe hook/page model.
- Cualquier salto de capa debe justificarse en PR.

### 4.2 Domain and Data Separation

- `domain/` define contratos y reglas de negocio.
- `data/` implementa persistencia/transporte.
- Hooks/page models consumen contratos del dominio y repositorios de data.

No mezclar reglas de negocio complejas dentro de componentes de presentacion.

### 4.3 Routing

- Mantener tipado de rutas en `frontend/src/router/routes.ts`.
- Mantener la logica de navegacion en `frontend/src/router/useRouter.ts`.
- Evitar logica de parseo de path duplicada en paginas/componentes.

## 5. Frontend Coding Rules

### 5.1 Imports and Exports

- Preferir barrel exports cuando existan (`@/components`, `@/hooks`, etc.).
- Import interno directo solo cuando el barrel no exponga el contrato necesario.
- En frontend, preferir named exports para componentes, hooks y utils.

Excepcion valida:
- `default export` en archivos donde el framework lo exige (ejemplo: Next API route en backend).

### 5.2 Components

- Un componente reusable por carpeta en `components/<Name>/`.
- Props tipadas en TypeScript.
- Evitar hardcodear texto configurable si corresponde modelarlo como prop o constante.
- Mantener consistencia visual con componentes existentes antes de introducir nuevos patrones.

### 5.3 Hooks and Page Models

- Los hooks deben encapsular estado/efectos, no render.
- En page models, priorizar callbacks estables (`useCallback`) cuando se pasen a componentes memoizados.
- Controlar cleanup en efectos asincronos para evitar `setState` post-unmount.

### 5.4 Performance

Aplicar cuando aporte valor real:

- `React.memo` para componentes de lista/widget con props estables.
- `useCallback`/`useMemo` en bordes de re-render costosos.
- Lazy loading en rutas/pantallas pesadas.

Evitar optimizaciones prematuras sin evidencia de problema.

## 6. Styling Rules

- Base de estilos en `frontend/src/globals.css` + utilidades Tailwind.
- Mantener consistencia de tokens y patrones visuales existentes.
- Evitar introducir un segundo sistema de estilos sin decision explicita.
- No usar la carpeta anomala `styles 12-01-36-379`.

## 7. Backend and API Rules

- Cada endpoint valida metodo HTTP, input y errores esperables.
- Las integraciones externas deben encapsularse en `backend/lib`.
- Estandarizar respuestas de error con mensaje y codigo cuando corresponda.
- Nunca exponer secretos o keys en cliente.

## 8. Error Handling and Resilience

- Manejar errores IO y de red de forma explicita.
- Definir mensajes de error accionables para UI.
- Priorizar fallback seguro ante fallos de proveedor externo.

## 9. Testing and Validation

Usar como baseline minimo:

```bash
# Frontend
npm --prefix frontend test
npm --prefix frontend run build

# Backend
npm --prefix backend run build
```

Para reglas detalladas de testing y evidencia en PR, usar:

- `/Users/argtobias/clocket-app/TestingValidationAgents.md`

## 10. Forbidden Actions

- Documentar o imponer estructuras que no existen en el repo actual.
- Crear capas nuevas sin justificarlo en la PR.
- Duplicar codigo que ya exista en `components/hooks/domain/data`.
- Mezclar cambios no relacionados en un mismo commit.
- Hacer cambios de arquitectura grandes sin plan de migracion explicito.

## 11. Definition of Done (Technical)

Una tarea tecnica queda lista cuando:

- respeta arquitectura y capas del repo actual
- evita regresiones funcionales conocidas
- incluye validaciones minimas ejecutadas
- mantiene coherencia con `AGENTS.md` y `ProductOrientedAgents.md`
- deja documentadas excepciones o deuda tecnica introducida
