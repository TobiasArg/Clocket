# Clocket App — Monorepo

Estructura inicial con dos proyectos:

- `frontend` — Vite + React (puerto 5173)
- `backend` — Next.js con API routes (puerto 3001)

Este repositorio ahora tiene un único `README.md` raíz con las instrucciones de ejecución. Se han eliminado los `README.md` duplicados en las carpetas `frontend` y `backend`.

Instrucciones rápidas:

## Backend

```bash
cd backend
npm install
npm run dev
```

El servidor de desarrollo de Next.js se ejecuta en el puerto 3001 (según los scripts).

## Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre con Vite en el puerto 5173 por defecto. Por defecto el `App.jsx` hace fetch a `http://localhost:3001/api/hello`.

Notas:

- Si prefieres mantener READMEs separados, puedo restaurarlos; actualmente fueron combinados en el README raíz para reducir duplicación.
- También consolidé las reglas de `.gitignore` en la raíz y eliminé los `.gitignore` en las subcarpetas.

## Limpieza automática de ramas/worktrees de agente

Después de commitear y pushear una rama de agente, puedes limpiar todo con:

```bash
scripts/cleanup-agent-worktree.sh --branch rescue/ec91 --yes
```

Opciones útiles:

- `--force`: fuerza borrado de worktree y rama local (`-D`).
- `--dry-run`: muestra qué haría sin ejecutar cambios.
- `--remote origin`: remoto a usar para borrar rama remota.
