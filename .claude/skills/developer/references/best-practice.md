You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
- Use semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`, `<section>`, `<article>`, `<button>`, `<a>`, headings `<h1>`–`<h6>`, lists, `<table>` with `<thead>`/`<tbody>`, `<form>`/`<label>`) over generic `<div>`/`<span>` wrappers. Reach for ARIA only to fill gaps the native element cannot express — never to recreate semantics that already exist (e.g. do not put `role="button"` on a `<div>`; use `<button>`).

### Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

# Project Conventions

The bullets above are the Angular team's official guidance. The conventions below are this project's enumerated rules — they layer on top of the team's guidance and apply to every Angular file generated in this workspace.

## Check the Angular version first

Best practices and available features vary significantly between versions — Signal Forms require v21+, `provideZonelessChangeDetection` requires v20+, etc. Read the project's Angular version from `package.json` before recommending any primitive, then pick guidance that matches that version.

## Keep component files focused on the class

A component `.ts` file declares the component class plus its template / style references. Types, interfaces, module-scope constants, and lookup tables that the component reads but does not own go in dedicated sibling files — `<name>.types.ts` for interfaces and unions, `<name>.tokens.ts` for `InjectionToken`s, `<name>.constants.ts` (or co-locate in the closest data layer) for plain literal tables.

```ts
// bad — types and config blob co-located in the component file
@Component({ /* … */ })
export class PackageTable {
  protected readonly columns = COLUMNS;
}
interface ColumnDef { /* … */ }
const COLUMNS: readonly ColumnDef[] = [ /* … */ ];
const PAGE_SIZE = 25;

// good — package-table.ts holds the class only; types and config live elsewhere
import { PACKAGE_COLUMNS, PACKAGE_PAGE_SIZE } from './package-table.tokens';
@Component({ /* … */ })
export class PackageTable {
  protected readonly columns = inject(PACKAGE_COLUMNS);
  protected readonly pageSize = inject(PACKAGE_PAGE_SIZE);
}
```

## No method calls in templates — use pipes

Method calls in templates run on every change-detection cycle, including for inputs that didn't change. Pure pipes are memoized by Angular against argument identity and only re-evaluate when their inputs change.

```html
<!-- bad — sortIndicatorFor and fmtDate run every CD tick -->
@switch (sortIndicatorFor(col.key)) { … }
{{ fmtDate(row.uploadedAt) }}

<!-- good — pipes cache by input identity -->
{{ col.key | sortIndicator }}
{{ row.uploadedAt | date }}
```

On a 25-row table re-rendering on every signal change, the difference is dozens of avoidable function calls per CD tick. Pipes are also reusable across components and easier to unit-test in isolation.

Acceptable exceptions: trivial expressions inside `@if` / `@for` where extracting a pipe would be more code than it saves (e.g. `@if (rows().length === 0)`).

## Shared state: single source of truth across consumers

When multiple UI pieces on the same screen depend on the same underlying data, the state that transforms or narrows that data lives in **one** signal (or a signal-exposing service) that the feature owns. Every consumer derives from it via `computed()`.

- Every consumer that renders from the shared data source reads through the same derivation. If a transformation applies to one consumer, it applies to every sibling consumer drawing from the same data on the same screen. Do not let one read the transformed view while another reads the raw source.
- If two consumers need the same derivation, expose it once as a `computed()` and have both subscribe — do not duplicate the logic.
- The state owner is the component or service closest to the shared scope: a single page → the page component; a feature spanning multiple pages → a feature-scoped service.
- Requirements that only describe one consumer's behavior do not license dropping sibling consumers out of the derivation. If the same data is rendered elsewhere on screen, the same transformation applies.

## Component configuration flows through `InjectionToken`, not module-scope const

When a component reads a configuration value — column metadata, page size, format options, default thresholds, lookup tables — declare it as an `InjectionToken<T>` and consume it via `inject()`. Do **not** import a module-scope const directly into the component. Making the component's dependencies explicit is the goal — the same component shape becomes reusable in another feature by providing a different value at the route or component level, with no source change.

```ts
// bad — component imports a const directly; reuse requires a code change
import { COLUMNS, PAGE_SIZE } from './package-table.constants';

@Component({ /* … */ })
export class PackageTable {
  protected readonly columns = COLUMNS;
  protected readonly pageSize = PAGE_SIZE;
}

// good — token + inject; the component declares what it needs, callers wire it up
import { PACKAGE_COLUMNS, PACKAGE_PAGE_SIZE } from './package-table.tokens';

@Component({
  providers: [
    { provide: PACKAGE_COLUMNS, useValue: DEFAULT_COLUMNS },
    { provide: PACKAGE_PAGE_SIZE, useValue: 25 },
  ],
  /* … */
})
export class PackageTable {
  protected readonly columns = inject(PACKAGE_COLUMNS);
  protected readonly pageSize = inject(PACKAGE_PAGE_SIZE);
}
```

Default values can ship at the component level via `providers: [{ provide: TOKEN, useValue: DEFAULT }]` so callers who don't need to override get the original behaviour for free.

## Default to per-route `loadComponent`, not eager `component:`

The default for child routes is `loadComponent: () => import('./<page>').then(m => m.<Page>)`. Eager `component: <Page>` is the exception, justified only when the route's own bundle would be small enough that a separate chunk wastes per-request overhead. A child route that pulls in a heavy library (large table modules, charts, state stores, etc.) **must** use `loadComponent` — eager loading drags the heavy chunk into every sibling route in the same `loadChildren` block.

```ts
// good — per-route lazy
{ path: '', loadComponent: () => import('./list/list-page').then(m => m.ListPage) },
{ path: ':id', loadComponent: () => import('./detail/detail-page').then(m => m.DetailPage) },

// bad — both pages co-bundled; the lightweight detail page inherits the heavy list page's chunk
{ path: '', component: ListPage },
{ path: ':id', component: DetailPage },
```

`loadChildren` at the parent only defers the *whole feature* until the user enters its prefix. Within the feature, every `component:` route is co-bundled — a 5-line detail page inherits its sibling list page's table module, charts, etc. The fix is one `loadComponent` per child route.

## Design tokens are CSS custom properties, not SCSS variables

Project tokens live in `src/styles/_tokens.scss` as CSS custom properties; component SCSS references them via `var(--token-name)`. SCSS variables are still useful for compile-time math (breakpoint maps, mixin parameters, computed grid values) — they just don't belong in the design-token vocabulary. Theme values must be CSS variables so they can be overridden at any DOM scope (light/dark, density, branding) without rebuild.

```scss
// good — theme value as a CSS variable, referenced from the component
:host {
  background: var(--fill-theme-surface);
  color: var(--fg-theme-primary);
  border-radius: var(--radius-sm);
}

// good — SCSS map used in a media query (compile-time only)
$breakpoints: (sm: 640px, md: 768px, lg: 1024px);
@media (min-width: map-get($breakpoints, md)) { /* ... */ }
```

## Reach for signals first; use RxJS where it earns its place

`toSignal`, `httpResource`, `linkedSignal`, and `computed` cover most reactive needs. RxJS still owns side-effecting streams, multi-subscriber HTTP, debounced inputs, and the inner-cancellation operators (`switchMap`, `mergeMap`, etc.). When a stream is unavoidable, follow the unsubscription and clean-pattern references in the developer skill.

## Forms: pick the strategy by Angular version

- Angular v21 or newer and a new form → **signal forms**.
- Angular v20 or older, or extending an existing form → match the application's current strategy (reactive in most cases; template-driven only for genuinely simple forms).
