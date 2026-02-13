# Agents.md — Mandatory Development Rules

Read this entire file before writing any code. Every rule in this document is mandatory. No exceptions.

---

## 1. Pre-Work Checklist

Before writing a single line of code, complete these steps in order:

1. Read this file completely.
2. Read the project's `CLAUDE.md` if it exists.
3. If a Tailwind skill exists in `/mnt/skills/`, read it before writing any styles or components.
4. Scan the full `src/` directory tree to understand what already exists.
5. Scan the barrel exports (`index.ts`) of every level-1 folder to know what is already available.
6. Identify if the code you need to write already exists. If it does, use it. Do not duplicate.
7. Identify which folder(s) your new code belongs in based on the rules below.
8. If the task involves creating documents (`.docx`, `.pptx`, `.xlsx`, `.pdf`), read the corresponding skill file in `/mnt/skills/` before starting.
9. If the task involves generating components from design tools via MCP, use the available MCP tools to read the design specifications before writing any code.

---

## 2. Styling Foundation — Tailwind CSS

**Tailwind CSS is the only styling method in this project.** Every style in every component is written using Tailwind utility classes. No exceptions.

### Global Styles

- The Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) live in a single `globals.css` or `index.css` file at the root of `src/`. This is the only CSS file outside of components.
- All theme customizations (colors, fonts, spacing extensions, custom animations) are defined in `tailwind.config.ts` / `tailwind.config.js`. Never in separate CSS files.

### Component Styles

- All component styles are Tailwind classes applied directly in the `.tsx` file. No separate style files.
- No inline styles (`style={{ }}`). No CSS-in-JS. No `.css` files. No `.scss` files.
- The only exception for a `.module.css` inside a component subfolder is when you need complex CSS that Tailwind cannot express: advanced pseudo-elements (`::before`/`::after` with dynamic content), or CSS selectors that have no Tailwind equivalent. This should be extremely rare.

### Tailwind Config as Source of Truth

- `tailwind.config` is the single source of truth for the design system: colors, fonts, spacing, breakpoints, shadows, border radius, and animations.
- Before adding a new value to the config, check if Tailwind's defaults already cover what you need.
- When extending the config, follow the existing naming patterns. If colors use `primary-50` through `primary-900`, new colors follow the same scale.

### Skills

- If a Tailwind skill file exists at `/mnt/skills/`, read it before writing any styles or components. The skill contains best practices and patterns specific to this project.

---

## 2. Project Structure — Exact Layout

```
src/
├── assets/                     # Static files only. Never code.
├── components/                 # Reusable UI components
│   ├── Button/
│   │   └── Button.tsx
│   ├── Card/
│   │   └── Card.tsx
│   ├── Navbar/
│   │   └── Navbar.tsx
│   └── index.ts               # Barrel: re-exports every component
├── constants/                  # Fixed values. Never logic.
│   ├── apiUrls.ts
│   ├── theme.ts
│   ├── routes.ts
│   └── index.ts               # Barrel: re-exports every constant
├── context/                    # React Contexts + Providers
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── index.ts               # Barrel: re-exports every context
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts
│   ├── useMediaQuery.ts
│   └── index.ts               # Barrel: re-exports every hook
├── modules/                    # Domain orchestrators. No logic inside.
│   ├── home/
│   │   └── index.tsx           # Only imports and re-exports
│   ├── auth/
│   │   └── index.tsx
│   └── ...
├── pages/                      # One folder per route domain
│   ├── Home/
│   │   ├── Home.tsx
│   │   ├── Pricing.tsx
│   │   └── Downloads.tsx
│   ├── Auth/
│   │   └── Auth.tsx
│   └── ...
├── types/                      # Shared TypeScript interfaces and types
│   ├── User.ts
│   ├── ApiResponse.ts
│   └── index.ts               # Barrel: re-exports every type
└── utils/                      # Helpers + API services + pure functions
    ├── formatDate.ts
    ├── homeApi.ts
    ├── validators.ts
    └── index.ts                # Barrel: re-exports every util
```

This is the only valid structure. Do not create folders outside of this layout. Do not add nesting levels beyond what is shown here.

---

## 3. Folder Rules — What to Store, What to Search, What to Create

### `assets/`

**Store:** Images (.png, .jpg, .webp, .gif), SVG icons, font files (.woff, .woff2, .ttf), logos, static JSON data files.
**Search here when:** You need an image, icon, font, or static file.
**Create here:** Only static files. Never `.ts`, `.tsx`, or `.js` files.
**Subfolders allowed:** Yes. Organize by type: `assets/images/`, `assets/icons/`, `assets/fonts/`.
**Barrel export:** No.

### `components/`

**Store:** Every reusable UI element. Buttons, inputs, cards, modals, navbars, footers, sidebars, badges, avatars, dropdowns, tables, loaders, toasts, tooltips. If it renders JSX and is used in more than one place, it belongs here.
**Search here when:** You need a UI element. Always check `components/index.ts` first before creating a new one.
**Create here:** One subfolder per component. The subfolder name matches the component name in PascalCase. Inside the subfolder: the `.tsx` file, and optionally a local `.module.css` or local type file if needed. Nothing else.
**Subfolders allowed:** Yes, but only one level — one subfolder per component. No nesting inside component subfolders.
**Barrel export:** Yes. `components/index.ts` re-exports every component.

**Component subfolder structure:**

```
components/
├── Button/
│   ├── Button.tsx              # The component (styles via Tailwind classes)
│   └── Button.types.ts         # Optional: local types only if complex
├── Card/
│   └── Card.tsx
└── index.ts                    # export { Button } from './Button/Button'
                                # export { Card } from './Card/Card'
```

**What does NOT go here:** Page-level components, layout wrappers that are page-specific, data fetching logic, API calls, business logic, context providers.

### `constants/`

**Store:** Values that never change at runtime. API base URLs, route paths, theme color tokens, breakpoint values, enum-like objects, static text strings, configuration objects, feature flags.
**Search here when:** You need a fixed value — a URL, a color, a route path, a config value. Always check before hardcoding any value.
**Create here:** One file per domain of constants. Name files in camelCase. Export each constant as `UPPER_SNAKE_CASE`.
**Subfolders allowed:** No. Flat files only.
**Barrel export:** Yes. `constants/index.ts` re-exports everything.

**Example file:**

```ts
// constants/apiUrls.ts
export const API_URLS = {
  BASE: "https://api.example.com",
  AUTH: "/auth",
  USERS: "/users",
} as const;
```

**What does NOT go here:** Functions, logic, computed values, anything that runs code at import time.

### `context/`

**Store:** React Context definitions and their Provider components. One file per context. Each file exports both the context and the provider.
**Search here when:** You need shared state that crosses multiple components without prop drilling — auth state, theme, language, user preferences, modal state.
**Create here:** One file per context. Name in PascalCase with `Context` suffix: `AuthContext.tsx`, `ThemeContext.tsx`.
**Subfolders allowed:** No. Flat files only.
**Barrel export:** Yes. `context/index.ts` re-exports every context and provider.

**Example file:**

```tsx
// context/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State and logic here
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
```

**What does NOT go here:** UI components, API calls (those go in `utils/`), hooks (those go in `hooks/`). The context file defines the context and provider only.

### `hooks/`

**Store:** Custom React hooks. One file per hook. Every hook starts with `use` prefix.
**Search here when:** You need reusable stateful logic — data fetching patterns, form handling, localStorage access, media queries, debouncing, intersection observer, keyboard shortcuts.
**Create here:** One file per hook. Name in camelCase with `use` prefix: `useAuth.ts`, `useLocalStorage.ts`, `useDebounce.ts`.
**Subfolders allowed:** Yes. Organize by domain when the folder grows beyond 10 files: `hooks/auth/`, `hooks/ui/`, `hooks/data/`. Each subfolder must have its own `index.ts` barrel. The root `hooks/index.ts` re-exports from all subfolders.
**Barrel export:** Yes. `hooks/index.ts` re-exports every hook, including those inside subfolders.

**Example file:**

```ts
// hooks/useDebounce.ts
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};
```

**What does NOT go here:** UI components, context definitions, pure utility functions that don't use React hooks (those go in `utils/`).

### `modules/`

**Store:** Domain orchestrators. A module groups and re-exports everything related to a specific domain (home, auth, builder, etc.) from the level-1 folders. A module contains ZERO logic. It only has import and export statements.
**Search here when:** You need everything related to a domain in one place — the hooks, context, utils, and types for "home" or "auth".
**Create here:** One subfolder per domain. Inside: a single `index.tsx` that imports from `@/hooks`, `@/context`, `@/utils`, `@/types`, `@/components` and re-exports them.
**Subfolders allowed:** Yes, one subfolder per domain. Inside each domain: only `index.tsx`. Nothing else.
**Barrel export:** Each module's `index.tsx` IS the barrel.

**Example file:**

```tsx
// modules/home/index.tsx
export { useHomeData } from "@/hooks/useHomeData";
export { HomeProvider } from "@/context/HomeContext";
export { getHomeData, updateHomeData } from "@/utils/homeApi";
export type { HomeData, HomeConfig } from "@/types/Home";
```

**What does NOT go here:** Functions, components, hooks, state logic, API calls, JSX. If you are writing anything other than `import`/`export` statements, you are in the wrong file.

### `pages/`

**Store:** Page-level views that map to routes. Each page composes components and connects them to data/logic via modules or direct barrel imports.
**Search here when:** You need to modify what a specific route renders.
**Create here:** One subfolder per route domain. Inside: one `.tsx` file per page/sub-route.
**Subfolders allowed:** Yes, one subfolder per route domain. Inside: flat `.tsx` files only. No nesting.
**Barrel export:** No.

**What a page file looks like:**

```tsx
// pages/Home/Home.tsx
import { Navbar, HeroSection, Footer } from "@/components";
import { useHomeData } from "@/modules/home";

export const Home = () => {
  const { data, loading } = useHomeData();

  return (
    <>
      <Navbar />
      <HeroSection data={data} loading={loading} />
      <Footer />
    </>
  );
};
```

**What does NOT go here:** Reusable UI code (that goes in `components/`), business logic (that goes in `hooks/` or `utils/`), shared state (that goes in `context/`). A page is a composition layer. It arranges components and passes data. It does not define UI elements or business rules.

### `types/`

**Store:** TypeScript interfaces, types, and enums that are used in more than one file. If a type is used only inside a single component or file, define it locally in that file instead.
**Search here when:** You need a shared type — User, ApiResponse, RouteParams, etc. Always check `types/index.ts` before defining a new type.
**Create here:** One file per type domain. Name in PascalCase: `User.ts`, `ApiResponse.ts`, `HomeData.ts`.
**Subfolders allowed:** No. Flat files only.
**Barrel export:** Yes. `types/index.ts` re-exports every type.

**What does NOT go here:** Component prop types (define those in the component file or in a local `.types.ts` inside the component subfolder). Runtime logic. Functions.

### `utils/`

**Store:** Three categories of code in one flat folder:

1. **Helpers** — Functions with business logic: date formatting, price calculations, text transformations specific to this app.
2. **Services** — API call functions: `getUsers()`, `createPost()`, `loginUser()`. Each service file groups API calls for one domain.
3. **Pure utilities** — Generic functions with no business logic: `deepClone()`, `debounce()`, `isEmail()`, `slugify()`.

**Search here when:** You need a function that is not a React hook and not a React component. Always check `utils/index.ts` before writing a new function.
**Create here:** One file per function group or domain. Name in camelCase: `formatDate.ts`, `homeApi.ts`, `validators.ts`.
**Subfolders allowed:** Yes. Organize by category when the folder grows beyond 10 files: `utils/helpers/`, `utils/services/`, `utils/validators/`. Each subfolder must have its own `index.ts` barrel. The root `utils/index.ts` re-exports from all subfolders.
**Barrel export:** Yes. `utils/index.ts` re-exports everything, including from subfolders.

**What does NOT go here:** React components, React hooks (anything using `useState`, `useEffect`, etc.), context definitions, constants.

---

## 4. Import Rules — Barrel Exports

Every level-1 folder (except `assets/` and `pages/`) has an `index.ts` that re-exports all its contents.

**Always import from the barrel:**

```tsx
// ✅ CORRECT
import { Button, Card, Navbar } from "@/components";
import { useAuth, useDebounce } from "@/hooks";
import { API_URLS, ROUTES } from "@/constants";
import { AuthProvider } from "@/context";
import { User, ApiResponse } from "@/types";
import { formatDate, getUsers } from "@/utils";
import { useHomeData, HomeProvider } from "@/modules/home";

// ❌ WRONG — never import from internal paths
import { Button } from "@/components/Button/Button";
import { useAuth } from "@/hooks/useAuth";
import { API_URLS } from "@/constants/apiUrls";
```

**When creating a new file:** After creating the file, immediately add its export to the barrel `index.ts` of its parent folder. This is not optional.

---

## 5. Code Creation Flow

When you need to build a new feature, follow this exact sequence:

### Step 1: Define Types

If the feature requires shared types, create them in `types/`. Add to `types/index.ts`.

### Step 2: Define Constants

If the feature uses fixed values (API URLs, config, route paths), create them in `constants/`. Add to `constants/index.ts`.

### Step 3: Create Utils/Services

If the feature needs API calls, create service functions in `utils/`. If it needs helper functions, create them in `utils/`. Add to `utils/index.ts`.

### Step 4: Create Context (if needed)

If the feature requires shared state across multiple components, create a context in `context/`. Add to `context/index.ts`.

### Step 5: Create Hooks

If the feature needs reusable stateful logic, create hooks in `hooks/`. Hooks consume from `utils/`, `context/`, and `constants/`. Add to `hooks/index.ts`.

### Step 6: Create Components

Build the UI components in `components/`. Each component gets its own subfolder. Components receive everything through props. Components import other components from `@/components`. Add to `components/index.ts`.

### Step 7: Create Module Orchestrator

Create or update the module in `modules/[domain]/index.tsx`. Import and re-export all hooks, context, utils, and types related to this feature.

### Step 8: Compose the Page

In `pages/`, create or update the page file. Import from the module or from barrels. Compose components. Pass data from hooks to components via props.

**This order is mandatory.** Types → Constants → Utils → Context → Hooks → Components → Module → Page. Build from the bottom up. Never start with the page.

---

## 6. Component Rules

Every component must follow these rules exactly:

```tsx
// components/FeatureCard/FeatureCard.tsx

interface FeatureCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  variant?: "default" | "highlighted";
  onClick?: () => void;
  className?: string;
}

export const FeatureCard = ({
  title = "Feature",
  description = "Description goes here",
  icon = null,
  variant = "default",
  onClick,
  className = "",
}: FeatureCardProps) => {
  return (
    <div
      className={`feature-card feature-card--${variant} ${className}`}
      onClick={onClick}
    >
      {icon && <span className="feature-card__icon">{icon}</span>}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};
```

**Mandatory:**

- TypeScript interface for all props. Named `[ComponentName]Props`.
- Destructured props with default values for every optional prop.
- Named export. Never default export.
- No hardcoded text. All strings come through props.
- Every component must work with zero props passed (defaults handle everything).
- Accept a `className` prop for external style overrides.
- Functional component. No class components.

---

## 7. Page Rules

```tsx
// pages/Home/Home.tsx

import { Navbar, HeroSection, PricingTable, Footer } from "@/components";
import { useHomeData } from "@/modules/home";

export const Home = () => {
  const { data, loading, error } = useHomeData();

  if (loading) return <Loader />;
  if (error) return <ErrorDisplay message={error.message} />;

  return (
    <>
      <Navbar />
      <HeroSection title={data.hero.title} subtitle={data.hero.subtitle} />
      <PricingTable plans={data.plans} />
      <Footer />
    </>
  );
};
```

**Mandatory:**

- A page only imports and composes components.
- A page never defines its own UI elements inline. No raw `<div>`, `<section>`, `<h1>` etc. unless it is purely structural layout (flex/grid wrappers).
- Data fetching and state logic comes from hooks via modules.
- A page passes data to components through their props.

---

## 8. Module Rules

```tsx
// modules/home/index.tsx

// Hooks
export { useHomeData } from "@/hooks/useHomeData";
export { useHomeFilters } from "@/hooks/useHomeFilters";

// Context
export { HomeProvider } from "@/context/HomeContext";

// Services
export { getHomeData, updateHomeSettings } from "@/utils/homeApi";

// Types
export type { HomeData, HomeConfig, HomeFilters } from "@/types/Home";
```

**Mandatory:**

- Only `import` and `export` statements. Nothing else.
- If you are writing a function, a variable, a component, or any logic: stop. You are in the wrong file.
- Group exports by category with comments: Hooks, Context, Services, Types.

---

## 9. Design Consistency — Styling New Components

Before creating any new component, you must analyze the existing codebase to ensure visual consistency across the entire application.

### Mandatory Pre-Design Steps

1. **Scan existing components** in `components/` and read their Tailwind classes. Identify the patterns already in use: color palette, spacing scale, border radius values, shadow styles, font sizes, font weights, and responsive breakpoints.
2. **Scan `styles/`** for global CSS variables, custom Tailwind config, and theme definitions.
3. **Scan `constants/`** for any theme tokens or design-related constants (colors, spacing, breakpoints).
4. **Extract the existing design system** from what you find. This means: if existing components use `rounded-lg`, you use `rounded-lg`. If they use `gap-4` for spacing, you use `gap-4`. If they use `text-gray-700` for body text, you use `text-gray-700`. Do not invent new values.

### Styling Rules

- **Use only Tailwind CSS** for all styling. No inline styles. No CSS-in-JS. No separate CSS files. The only exception is a `.module.css` inside a component subfolder for CSS that Tailwind literally cannot express (advanced pseudo-elements with dynamic content, complex CSS selectors with no Tailwind equivalent). This exception should be extremely rare — if you think you need it, look for a Tailwind solution first.
- **Match existing patterns exactly.** Every color, spacing, radius, shadow, and typography class must come from the patterns already established in the codebase. If the codebase uses `bg-blue-600` for primary buttons, every new primary button uses `bg-blue-600`.
- **If no pattern exists** for something you need (e.g., no existing toast component to reference), use the closest related pattern and extend it logically within Tailwind's default scale.
- **Responsive design:** Follow the same breakpoint pattern used in existing components. Check which prefixes are used (`sm:`, `md:`, `lg:`, `xl:`) and apply them consistently.
- **Dark mode:** If existing components use dark mode classes (`dark:`), all new components must also support dark mode using the same approach.

### Animations

- For animations, use the **Tailwind Animations** library (`tailwindcss-animate`).
- Before creating a custom animation, check if `tailwindcss-animate` already provides what you need (fade-in, slide-in, zoom, spin, bounce, pulse, etc.).
- Apply animation classes directly via Tailwind utilities: `animate-fade-in`, `animate-slide-in-bottom`, `animate-zoom-in`, etc.
- If a required animation does not exist in the library, define it in `tailwind.config` under `extend.animation` and `extend.keyframes`. Never write raw CSS keyframes in component files.
- Keep animations subtle and consistent. If existing components use `duration-200` for transitions, new components use `duration-200`.

### What NOT to Do

- Do not introduce new colors, spacing values, or font sizes that are not already in use unless explicitly instructed.
- Do not mix styling approaches (e.g., Tailwind + inline styles in the same component).
- Do not create animations with raw CSS when `tailwindcss-animate` or Tailwind's built-in utilities can handle it.

---

## 10. Naming Conventions

| Element         | Convention                        | Filename Example    | Code Example                |
| --------------- | --------------------------------- | ------------------- | --------------------------- |
| Component       | PascalCase                        | `HeroSection.tsx`   | `export const HeroSection`  |
| Page            | PascalCase                        | `Home.tsx`          | `export const Home`         |
| Hook            | camelCase + `use` prefix          | `useHomeData.ts`    | `export const useHomeData`  |
| Context         | PascalCase + `Context` suffix     | `AuthContext.tsx`   | `const AuthContext`         |
| Provider        | PascalCase + `Provider` suffix    | inside context file | `export const AuthProvider` |
| Util/Helper     | camelCase                         | `formatDate.ts`     | `export const formatDate`   |
| Service         | camelCase + domain + `Api` suffix | `homeApi.ts`        | `export const getHomeData`  |
| Type/Interface  | PascalCase                        | `User.ts`           | `export interface User`     |
| Constant file   | camelCase                         | `apiUrls.ts`        | `export const API_URLS`     |
| Constant value  | UPPER_SNAKE_CASE                  | —                   | `API_URLS`, `THEME_COLORS`  |
| Props interface | PascalCase + `Props` suffix       | —                   | `interface ButtonProps`     |

---

## 11. Forbidden Actions

These actions are never allowed under any circumstance:

- Creating folders outside of the defined structure.
- Creating subfolders inside `constants/`, `context/`, or `types/`.
- Creating subfolders inside `hooks/` or `utils/` when there are fewer than 10 files. Keep flat until organization is needed.
- Creating more than one level of nesting inside `components/` (one subfolder per component, nothing deeper).
- Writing logic inside a `modules/` file.
- Writing raw UI markup inside a `pages/` file (structural layout wrappers excepted).
- Hardcoding any string, color, URL, size, or configuration value that should be a prop or constant.
- Importing from internal file paths instead of barrel exports.
- Creating a new file without adding it to the corresponding barrel `index.ts`.
- Duplicating functionality that already exists in the project. Search first.
- Renaming existing files or components without explicit instruction to do so.
- Using default exports. Always use named exports.
