# Testing and Validation Rules (Clocket)

Este documento define validaciones tecnicas minimas para cambios en el repo.
Se usa junto con:

- `/Users/argtobias/clocket-app/AGENTS.md`
- `/Users/argtobias/clocket-app/TecnicalAgents.md`
- `/Users/argtobias/clocket-app/ProductOrientedAgents.md`

## 1. Objectives

- Prevenir regresiones antes de merge.
- Estandarizar la evidencia de calidad en Pull Requests.
- Alinear validaciones locales con CI existente.

## 2. Validation Matrix by Change Type

| Change Type | Required Validations | Evidence in PR |
| --- | --- | --- |
| Frontend UI/components/pages/router | `npm --prefix frontend test` + `npm --prefix frontend run build` | Capturas/GIF + resumen de pruebas manuales |
| Frontend domain/data/hooks | `npm --prefix frontend test` + tests unitarios/actualizados del modulo afectado | Casos cubiertos y resultado |
| Backend API/lib | `npm --prefix backend run build` + prueba manual del endpoint afectado | Request/response esperada y errores contemplados |
| CI/workflows/scripts | Validacion de sintaxis y comportamiento esperado | Impacto en pipelines y rollback plan |
| AGENTS/docs operativos | Revision de consistencia cruzada entre documentos | Secciones actualizadas + cambios clave |

## 3. Mandatory Baseline Commands

```bash
# Frontend
npm --prefix frontend test
npm --prefix frontend run build

# Backend
npm --prefix backend run build
```

Si una validacion no puede ejecutarse, se debe documentar:

- motivo concreto
- impacto potencial
- mitigacion temporal

## 4. Manual Validation Scenarios

### 4.1 Frontend

Validar al menos:

- navegacion de la feature afectada
- estados de carga, vacio y error
- comportamiento en mobile/desktop cuando aplique

### 4.2 Backend/API

Validar al menos:

- request valido (200 esperado)
- request invalido (4xx esperado)
- fallo de proveedor externo o error inesperado (5xx/fallback esperado)

## 5. Pull Request Checklist (Mandatory)

Toda PR debe incluir:

- objetivo y alcance
- riesgos/regresiones esperadas
- comandos ejecutados y resultado
- evidencia visual para cambios UI
- compatibilidad con reglas tecnicas y de producto
- gaps pendientes de cobertura (si aplica)

## 6. CI Alignment

Regla minima actual:

- `frontend-bundle-check.yml` corre en PRs y pushes a `main`/`dev` cuando hay cambios en `frontend/**`.

La validacion local no reemplaza CI; ambas son obligatorias.

## 7. Quality Gates

No considerar lista una entrega cuando:

- falla `frontend test` o `frontend build` en cambios de frontend
- falla `backend build` en cambios de backend
- no existe evidencia minima de validacion en PR
- hay regresiones conocidas no documentadas

## 8. Continuous Improvement Targets

- aumentar cobertura en modulos criticos (transactions, budgets, investments)
- definir smoke tests de rutas principales
- reforzar validaciones de errores y estados limite
