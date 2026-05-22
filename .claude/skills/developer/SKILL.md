---
name: developer
description: Write Angular code following modern primitives (signals, linkedSignal, resource, httpResource, computed, effect), reactive and signal forms, DI with InjectionTokens, lazy routing, SSR, ARIA accessibility, animations, CSS-variable design tokens, Vitest testing, and the lint/build gate. Trigger when creating or modifying components, services, directives, pipes, routes, guards, resolvers, interceptors, or any TypeScript file in an Angular workspace; when refactoring an existing component to modern primitives; or for best-practice guidance on reactivity, forms, DI, routing, styling, ARIA, or testing in Angular.
---

# Angular Developer Guidelines

## How to use this skill

This skill is references-driven. The **Rules** section below is the always-applies core — read it before generating any code. The **References** section that follows is topic-organized; load only the files relevant to the current task.

For library facts that change between Angular releases (CLI flags, schematics, deprecated APIs), the references are best-effort snapshots and may drift. When in doubt about a current API, fetch the official Angular docs at angular.dev and treat the local reference as a starting point.

---

## Rules

Read [best-practice.md](references/best-practice.md) before generating any code. It enumerates the always-apply rules — Angular team's official guidance plus this project's conventions for version checks, focused component files, template performance, single-source shared state, DI configuration, lazy routing, design tokens, signals-first reactivity, and form strategy.

---

## References

### Components

- **Fundamentals** — anatomy, metadata, core concepts, native control flow (`@if`, `@for`, `@switch`). Read [components.md](references/components.md)
- **Inputs** — signal-based inputs, transforms, model inputs. Read [inputs.md](references/inputs.md)
- **Outputs** — signal-based outputs and custom event best practices. Read [outputs.md](references/outputs.md)
- **Host elements** — host bindings and attribute injection. Read [host-elements.md](references/host-elements.md)

For deeper documentation not in the references, consult `https://angular.dev/guide/components`.

### Reactivity and data management

- **Signals overview** — `signal`, `computed`, reactive contexts, `untracked`. Read [signals-overview.md](references/signals-overview.md)
- **Dependent state (`linkedSignal`)** — writable state linked to source signals. Read [linked-signal.md](references/linked-signal.md)
- **Async reactivity (`resource`)** — fetching async data into signal state. Read [resource.md](references/resource.md)
- **Side effects (`effect`)** — logging, third-party DOM manipulation (`afterRenderEffect`), and when **not** to use effects. Read [effects.md](references/effects.md)
- **Encapsulation-first API design** — default to `private`; expose private signals through `asReadonly()` and gated mutation methods; use `protected` for template-bound members. Read [encapsulation-first-design.md](references/encapsulation-first-design.md)

### RxJS

- **Unsubscription** — `takeUntil` vs `takeUntilDestroyed` vs `toSignal` / `async` pipe; the operator-order rule for memory-leak prevention. Read [rxjs-unsubscription.md](references/rxjs-unsubscription.md)
- **Clean patterns** — nested subscriptions → flattening operators; reference-equality `distinctUntilChanged`; side effects in `map` vs `tap`; cold-observable duplicate HTTP; manual subscriptions. Read [rxjs-clean-patterns.md](references/rxjs-clean-patterns.md)

### Forms

- **Signal forms** — signals for form state. Read [signal-forms.md](references/signal-forms.md)
- **Template-driven forms** — for genuinely simple forms. Read [template-driven-forms.md](references/template-driven-forms.md)
- **Reactive forms** — for complex forms. Read [reactive-forms.md](references/reactive-forms.md)
- **Reactive form reset strategies** — `formGroup.reset()` vs `formGroupDirective.resetForm()` (the `ng-submitted` story), the initial-state preservation pattern, `nonNullable` reset behaviour, and intercepting native `<button type="reset">`. Read [reactive-form-reset.md](references/reactive-form-reset.md)

### Dependency injection

- **Fundamentals** — DI overview, services, the `inject()` function. Read [di-fundamentals.md](references/di-fundamentals.md)
- **Creating and using services** — services, `providedIn: 'root'`, injection into components or other services. Read [creating-services.md](references/creating-services.md)
- **Defining providers** — automatic vs manual provision, `InjectionToken`, `useClass`, `useValue`, `useFactory`, scopes. Read [defining-providers.md](references/defining-providers.md)
- **Injection context** — where `inject()` is allowed, `runInInjectionContext`, `assertInInjectionContext`. Read [injection-context.md](references/injection-context.md)
- **Hierarchical injectors** — `EnvironmentInjector` vs `ElementInjector`, resolution rules, modifiers (`optional`, `skipSelf`), `providers` vs `viewProviders`. Read [hierarchical-injectors.md](references/hierarchical-injectors.md)

### Accessibility (Angular Aria)

- **Angular Aria components** — building headless, accessible components (Accordion, Listbox, Combobox, Menu, Tabs, Toolbar, Tree, Grid) and styling ARIA attributes. Read [angular-aria.md](references/angular-aria.md)

### Routing

- **Define routes** — URL paths, static vs dynamic segments, wildcards, redirects. Read [define-routes.md](references/define-routes.md)
- **Route loading strategies** — eager vs lazy, context-aware loading. Read [loading-strategies.md](references/loading-strategies.md)
- **Show routes with outlets** — `<router-outlet>`, nested outlets, named outlets. Read [show-routes-with-outlets.md](references/show-routes-with-outlets.md)
- **Navigate to routes** — declarative navigation with `RouterLink` and programmatic with `Router`. Read [navigate-to-routes.md](references/navigate-to-routes.md)
- **Route guards** — `CanActivate`, `CanMatch`, and other guards. Read [route-guards.md](references/route-guards.md)
- **Data resolvers** — pre-fetching with `ResolveFn`. Read [data-resolvers.md](references/data-resolvers.md)
- **Router lifecycle and events** — chronological order of navigation events; debugging. Read [router-lifecycle.md](references/router-lifecycle.md)
- **Rendering strategies** — CSR, SSG (Prerendering), SSR with hydration. Read [rendering-strategies.md](references/rendering-strategies.md)
- **Route transition animations** — enabling and customizing the View Transitions API. Read [route-animations.md](references/route-animations.md)

For deeper context, consult the [official Angular Routing guide](https://angular.dev/guide/routing).

### Styling and animations

- **Angular animations** — native CSS (recommended) and the legacy DSL for dynamic effects. Read [angular-animations.md](references/angular-animations.md)
- **Styling components** — best practices for component styles and encapsulation. Read [component-styling.md](references/component-styling.md)

### Testing

- **Fundamentals** — unit testing with Vitest, async patterns, `TestBed`. Read [testing-fundamentals.md](references/testing-fundamentals.md)
- **Component harnesses** — standard patterns for robust component interaction. Read [component-harnesses.md](references/component-harnesses.md)
- **Router testing** — `RouterTestingHarness` for reliable navigation tests. Read [router-testing.md](references/router-testing.md)

### Generators

Use the Angular CLI to generate code, then augment as needed:

- Component: `npx ng generate component <name>`
- Service: `npx ng generate service <name>`
- Pipe: `npx ng generate pipe <name>`
- Directive: `npx ng generate directive <name>`
- Interface: `npx ng generate interface <name>`
- Guard: `npx ng generate guard <name>`
- Interceptor: `npx ng generate interceptor <name>`
- Resolver: `npx ng generate resolver <name>`
- Enum: `npx ng generate enum <name>`
- Class: `npx ng generate class <name>`

The CLI drops generated files in the current working directory — `cd` into the intended folder before running the command. Take note of the path the CLI prints so you know where each file landed.
