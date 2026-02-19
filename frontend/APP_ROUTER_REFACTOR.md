# App.tsx Refactor — Router Modularization

## Problema

`App.tsx` concentraba tres responsabilidades distintas en un solo archivo de 287 líneas:
- Tipos y utilidades de rutas (path parsing, normalización)
- Estado y lógica de navegación
- Mapeo de rutas a componentes de página

## Estado previo

Un único archivo `src/App.tsx` (~287 líneas) con todo mezclado:

```
src/
└── App.tsx  ← tipos + hook de navegación + switch de rutas + shell visual
```

## Estado actual

```
src/
├── App.tsx                  ← 19 líneas, solo el shell visual
└── router/
    ├── routes.ts            ← tipos, constantes y funciones puras de rutas
    ├── useRouter.ts         ← hook de navegación (estado + navigateTo)
    └── AppRouter.tsx        ← mapeo path → componente de página
```

## Qué hace cada archivo

### `router/routes.ts`
Tipos TypeScript y funciones puras sin efectos secundarios:
- `AppPath`, `StaticAppPath`, `GoalDetailPath`, `BudgetDetailPath`
- `normalizePath`, `isStaticAppPath`, `isGoalDetailPath`, `isBudgetDetailPath`
- `extractGoalId`, `extractBudgetId`
- `toGoalDetailPath`, `toBudgetDetailPath`
- `resolvePathFromLocation`

### `router/useRouter.ts`
Custom hook que encapsula toda la lógica de navegación:
- Estado `currentPath`
- Listener de `popstate` (navegación con botón back del browser)
- Sincronización inicial del path desde la URL
- Función `navigateTo(path, replace?)` — estabilizada con `useCallback`

### `router/AppRouter.tsx`
Componente que recibe `currentPath` y `navigateTo` y renderiza la página correcta:
- Maneja rutas dinámicas (`/goals/:id`, `/budget-detail/:id`) antes del switch
- `goBack` extraído como constante de módulo (evita crear arrow functions en cada render)
- `StatisticsLazy` con lazy loading

### `App.tsx`
Solo el wrapper visual:
```tsx
export function App() {
  const { currentPath, navigateTo } = useRouter();
  // ...shell div con className según desktop/mobile
  return <AppRouter currentPath={currentPath} navigateTo={navigateTo} />;
}
```

## Mejoras adicionales

- `navigateTo` es ahora `useCallback`-stable → no causa re-renders innecesarios
- `goBack` (`() => window.history.back()`) es una constante de módulo, no se recrea en cada render
- Todos los botones de back/exit usan `window.history.back()` → siempre vuelven a la pestaña anterior real
