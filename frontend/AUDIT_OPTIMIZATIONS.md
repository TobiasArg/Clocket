# Audit de Optimizaciones — Clocket Frontend

Resumen técnico de todas las mejoras aplicadas en la rama `audit/high-impact-optimizations`.

---

## 1. Shared Cache + Promise Deduplication en Hooks de Datos

**Archivos:** `useTransactions`, `useAccounts`, `useCategories`, `useCuotas`, `useGoals`, `useBudgets`, `useInvestments`

### Qué había antes
Cada vez que un componente montaba (por ejemplo, al navegar a una pantalla), el hook llamaba a `repository.list()` incondicionalmente. Esto significaba que:

- Al entrar a la pantalla de Transacciones → petición a la base de datos local.
- Si en la misma pantalla había dos componentes usando `useTransactions` → **dos peticiones simultáneas al mismo repositorio**.
- Al volver a la pantalla (desde otra) → nueva petición, con spinner de carga visible.

### Qué se hizo
Se introdujo un módulo de caché a nivel de módulo (`sharedXxxCache`) y una variable de promesa en vuelo (`sharedXxxRefreshPromise`) siguiendo el patrón ya existente en `useAppSettings`.

```
Primera vez: caché vacío → fetch() → llena el caché → todos los suscriptores reciben datos
Segunda vez: caché lleno → retorna datos inmediatamente, sin petición
Mounts concurrentes: si ya hay un fetch en vuelo, todos esperan la misma promesa (no N fetches)
```

### Mejora real
- **Navegación sin spinner:** al volver a una pantalla ya visitada, los datos aparecen instantáneamente desde caché. No hay estado de "cargando".
- **Cero requests duplicados:** en pantallas donde múltiples widgets usan el mismo hook (por ejemplo, Home), se hace una sola llamada en lugar de N.
- **Consistencia de datos:** todas las mutaciones (crear, editar, eliminar) actualizan el caché directamente, entonces la UI refleja el cambio sin necesidad de re-fetch.

---

## 2. React.memo en 74 Componentes

**Categorías cubiertas:**
- Átomos: `PhosphorIcon`, `IconBadge`, `ProgressBar`, `SpendingBar`, `TextBadge`, `Avatar`, `ProgressSection`, `PageHeader`, `BottomNavigation`, `Divider`, `Dot`, `StatDisplay`, `ActionButton`, `CategoryColorPicker`, `CategoryIconPicker`, `MetricGrid`, `OptionGrid`, y más.
- List-items: `ListItemRow`, `CategoryItem`, `InvestmentPositionItem`, `TransactionSwipeDeleteRow`, `AccountSwipeDeleteRow`, `StockCard`.
- Widgets pesados: `TransactionEditorWidget`, `TransactionsMonthListWidget`, `PlansListWidget`, `AccountsListWidget`, `InvestmentPositionDetailPanel`, `BudgetDetailProgressWidget`, `StatisticsViewCarousel`, y ~20 más.
- Widgets de home: `GoalsWidget`, `BudgetListWidget`, `RecentTransactionsWidget`, `BalanceWidget`, `SpendingInfoWidget`, `InstallmentPlansWidget`, y más.
- Sub-vistas de estadísticas: `FlowDayView`, `FlowWeekView`, `FlowMonthView`, `TrendDayView`, `TrendWeekView`, `TrendMonthView`, `TrendChartView`.

### Qué había antes
Sin `React.memo`, **cualquier re-render del componente padre causaba que todos sus hijos se re-renderizaran**, incluso si sus props no habían cambiado. En una lista de 30 transacciones, si el padre actualizaba su estado interno (por ejemplo, un tooltip o un modal abierto), los 30 ítems volvían a ejecutar su función de render.

### Qué se hizo
`React.memo` envuelve el componente con una comparación superficial de props. Si las props no cambiaron, React **reutiliza el output del render anterior** sin ejecutar la función del componente.

```
Sin memo: padre re-renderiza → todos los hijos re-renderizan (O(n))
Con memo: padre re-renderiza → solo los hijos con props cambiadas re-renderizan (O(k), k << n)
```

### Mejora real
- **Listas con scroll fluido:** al hacer scroll en Transacciones, Planes o Metas, los ítems que ya están renderizados y no cambiaron no se vuelven a calcular.
- **Modales y editors sin lag:** abrir `TransactionEditorWidget` o `SlideUpSheet` no fuerza el re-render de toda la lista visible.
- **Home page eficiente:** cuando un widget actualiza su estado interno (por ejemplo, el carrusel de estadísticas cambia de tab), los otros 5-6 widgets del home no se re-renderizan.

---

## 3. useCallback en Page Models y Page Components

**Archivos de hooks:** `useTransactionsPageModel`, `useGoalDetailPageModel`, `usePlansPageModel`, `useAccountsPageModel`, `useGoalsPageModel`, `useBudgetsPageModel` (60+ funciones en total).

**Archivos de páginas:** `Goals.tsx`, `Plans.tsx`, `Accounts.tsx`, `Investments.tsx`, `Budgets.tsx`, `Categories.tsx`, `GoalDetail.tsx`, `BudgetDetail.tsx`.

### Qué había antes
Las funciones (`handleCreate`, `handleDelete`, etc.) se declaraban como arrow functions directas dentro del hook o como props inline en el JSX:

```tsx
// En el hook:
const handleCreate = async () => { ... };  // nueva referencia en cada render

// En la página:
<ListWidget onItemClick={(id) => goToDetail(id)} />  // nueva referencia en cada render
```

Con `React.memo` en el hijo, esto **anulaba completamente la optimización**: aunque las props "parecían" iguales, la referencia de la función era nueva en cada render, así que el hijo se re-renderizaba igual.

### Qué se hizo
Todas las funciones se envolvieron en `useCallback` con arrays de dependencias precisos:

```tsx
// En el hook:
const handleCreate = useCallback(async () => { ... }, [dep1, dep2]);

// En la página:
const handleCreateVoid = useCallback(() => { void handleCreate(); }, [handleCreate]);
```

### Mejora real
- **React.memo ahora funciona correctamente:** los componentes hijo solo re-renderizan cuando los datos cambian, no en cada render del padre.
- **Cadena de optimizaciones completa:** memo + callback estable = skip de render garantizado cuando no hay cambio real.
- **Menos cálculos en pantallas complejas:** `TransactionsPage` (con listas, editor, modales) mantiene estables las referencias hacia sus hijos durante la vida normal de la pantalla.

---

## 4. Callbacks Estables en AppRouter

**Archivo:** `src/router/AppRouter.tsx`

### Qué había antes
Las funciones de navegación que se pasaban como props a los widgets del Home (`goToTransactions`, `goToGoal`, `goToBudget`, etc.) se creaban como arrow functions inline en el JSX del router. Esto significaba que en cada render del router, **todas las referencias cambiaban**, causando re-renders en cascada de todos los widgets memoizados.

### Qué se hizo
Todas las funciones de navegación se envolvieron en `useCallback` con dependencias estables (solo `navigate` del router).

### Mejora real
- **Widgets del Home no se re-renderizan al navegar:** cuando el router actualiza su estado interno (por ejemplo, al registrar una nueva ruta visitada), los widgets `BalanceWidget`, `RecentTransactionsWidget`, etc., no se re-renderizan porque sus callbacks de navegación tienen la misma referencia.

---

## 5. Async Cleanup en useInvestmentsPageModel

**Archivo:** `src/hooks/useInvestmentsPageModel.ts`

### Qué había antes
Dos efectos asíncronos (batch refresh de cotizaciones, carga de entradas de posición) no cancelaban su trabajo al desmontar el componente. Si el usuario navegaba fuera de Inversiones mientras un fetch estaba en vuelo, el callback del `then()` intentaba hacer `setState()` sobre un componente ya desmontado.

En React 18 con StrictMode esto genera warnings. En producción puede causar **fugas de memoria** o **actualizaciones de estado fantasma** que corrompen la UI de la pantalla siguiente.

### Qué se hizo
Se introdujo un flag `cancelled` por efecto:

```ts
useEffect(() => {
  let cancelled = false;
  fetchSomething().then((data) => {
    if (!cancelled) setState(data);
  });
  return () => { cancelled = true; };
}, [deps]);
```

### Mejora real
- **Sin memory leaks:** al salir de Inversiones, los fetches en vuelo se descartan limpiamente.
- **Sin corrupciones de estado:** la UI de la pantalla siguiente no recibe actualizaciones de estado de una pantalla ya desmontada.
- **Compatibilidad con StrictMode:** sin warnings en desarrollo.

---

## 6. ErrorBoundary Global

**Archivo:** `src/components/ErrorBoundary/ErrorBoundary.tsx`

### Qué había antes
Sin `ErrorBoundary`, cualquier excepción de JavaScript no capturada durante el render de un componente causaba que **toda la aplicación se congelara en una pantalla en blanco**, sin feedback al usuario.

### Qué se hizo
Se envolvió el árbol raíz en un `ErrorBoundary` de clase con UI de fallback en español, que captura errores de render y muestra un mensaje de error amigable con opción de reintentar.

### Mejora real
- **La app no muere silenciosamente:** errores inesperados muestran una pantalla de error en lugar de blanco.
- **Experiencia recuperable:** el usuario puede intentar volver sin tener que matar y reabrir la app.

---

## 7. Animaciones de Entrada en Gráficos de Estadísticas

**Archivos:** `globals.css`, `FlowChartView.tsx`, `TrendChartView.tsx`, `StatisticsBalanceWidget.tsx`, `StatisticsSavingsWidget.tsx`

### Qué había antes
Los gráficos SVG tenían `key={animationKey}` pensado para disparar animaciones CSS al re-montarse, pero **nunca se definió ninguna animación**. El resultado era:

- El placeholder `Suspense` era un div en blanco invisible.
- Al cargar el componente lazy, el gráfico aparecía de golpe, sin transición.
- Al cambiar el scope (mes/histórico), el gráfico se reemplazaba abruptamente.

### Qué se hizo
1. Se definió `@keyframes chart-in` en `globals.css`: fade-in + translateY + scale suave (0.42s, spring easing). Respeta `prefers-reduced-motion`.
2. Se aplicó `animate-chart-in` al div contenedor de cada gráfico (no al SVG directamente), de forma que el frame completo (borde + fondo + datos) anima en conjunto.
3. Se movió el `key={viewAnimKey}` al componente `<ViewComponent>` en el widget padre, así toda la instancia del gráfico se re-monta (y re-anima) cuando cambia el scope o los datos.
4. Los placeholders de Suspense y de vistas no cargadas pasaron de divs vacíos a `animate-pulse`, comunicando visualmente el estado de carga.

### Mejora real
- **Entrada suave al navegar a Estadísticas:** los gráficos aparecen con una animación de float-in en lugar de pop abrupto.
- **Re-animación al cambiar scope:** al cambiar entre "Este mes" e "Histórico", los gráficos re-animan los datos nuevos, dando feedback visual claro del cambio.
- **Loading state visible:** el pulso indica que hay datos cargando, en lugar de un hueco en blanco desorientador.

---

## 8. Accesibilidad — aria-labels

**Archivos:** `GoalsWidget`, `BudgetListWidget`, `GoalsListWidget`, `CategoriesListWidget`

Se agregaron `aria-label` descriptivos a botones interactivos que solo contenían íconos, sin texto visible. Esto permite que lectores de pantalla identifiquen correctamente la acción de cada botón.

---

## Resumen de Impacto

| Área | Antes | Después |
|---|---|---|
| Navegación entre pantallas | Spinner + fetch en cada visita | Datos inmediatos desde caché |
| Re-renders en listas | O(n) por cualquier cambio en el padre | O(k) solo ítems con props nuevas |
| React.memo efectividad | Anulada por callbacks inline | Funcional gracias a referencias estables |
| Requests concurrentes | Hasta N fetches duplicados por pantalla | 1 fetch compartido entre todos los mounts |
| Errores de render | Pantalla en blanco total | ErrorBoundary con fallback en español |
| Gráficos de estadísticas | Pop abrupto sin transición | Animación de entrada + re-animación por cambio de datos |
| Memory leaks en Inversiones | Posibles setState post-unmount | Cancelados con flag de cleanup |
| Accesibilidad | Botones sin etiqueta para screenreaders | aria-labels descriptivos |

---

## Lo que quedó pendiente (fuera del scope del audit)

- **Virtualización de listas largas** (`GoalsListWidget`, `AccountsListWidget`): para listas de 100+ ítems se recomendaría `react-window` o `@tanstack/virtual`. El impacto actual es bajo porque los datos típicos son de volumen moderado.
- **Inline arrows en `renderTrendSlide`:** el callback `onSelectPoint` dentro del `useMemo` de `StatisticsSavingsWidget` crea una nueva referencia al cambiar `selectedPointIndex`. No causa bugs, pero limita parcialmente el beneficio del memo en `TrendChartView`.
