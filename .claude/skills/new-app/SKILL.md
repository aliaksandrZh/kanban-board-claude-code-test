---
name: new-app
description: Scaffold a new Angular application with modern defaults — standalone components, signals, zoneless change detection (Angular 20+), OnPush, and ESLint with Angular-aware rules. Library-agnostic — installs ESLint only at scaffold time; any component library is added on demand. Trigger when scaffolding a new Angular app, when the workspace does not yet have a `src/app` directory, or when starting an Angular project from scratch.
---

# Angular New App

Modern Angular only: standalone components, signals, `@if`/`@for`/`@switch` control flow, `OnPush` change detection.

Follow these steps when creating a new Angular application.

## 1. Pre-checks

Before scaffolding, verify:

- **CLI available**: run `npx ng version`. Works on both Unix and Windows and does not require a global install. If `npx` is unavailable, install the CLI globally with `npm install -g @angular/cli`.
- **Target folder is empty**: `ng new` will fail if a folder of that name already contains files — pick a new name or clear the folder before scaffolding.
- **Parent is a git repo**: if the current directory is already under git, always pass `--skip-git` to avoid initializing a nested repo.

## 2. Create the application

Derive the app name from the user's prompt, then run:

```
npx ng new <app-name> --strict --skip-git --interactive=false [additional flags]
```

Do **not** pass `--ai-config` — it would generate a stock `CLAUDE.md` that conflicts with project conventions.

Commonly useful additional flags based on user requirements:

- `--style=scss|css|less` — stylesheet format
- `--routing` — add routing
- `--ssr` — enable server-side rendering
- `--prefix=<prefix>` — component selector prefix
- `--package-manager=npm|pnpm|yarn` — package manager
- `--zoneless` — opt into zoneless change detection (Angular 20+; skip if the installed CLI rejects the flag)
- `--skip-tests` — only if the user explicitly requests it

## 3. Configure defaults

After scaffolding, adjust the generated project so every new component follows modern Angular defaults.

**OnPush as schematic default** — merge `changeDetection: "OnPush"` into `projects.<app-name>.schematics["@schematics/angular:component"]` in `angular.json`. If `--style=scss` was passed to `ng new`, `style` will already be present — keep it and add `changeDetection` alongside. The final block should look like:

```json
"schematics": {
  "@schematics/angular:component": {
    "changeDetection": "OnPush"
  }
}
```

**Zoneless change detection** — if `--zoneless` was passed in step 2 and accepted, the scaffold is already zoneless; no further action needed. Otherwise, convert manually:

1. In `src/app/app.config.ts`, replace `provideZoneChangeDetection(...)` with `provideZonelessChangeDetection()` imported from `@angular/core`.
2. Remove `zone.js` from the `polyfills` array in `angular.json` if present.

If the installed Angular version does not expose `provideZonelessChangeDetection` (pre-20), skip the zoneless conversion and leave the default zone-based setup in place.

**Clean default template and styles** — `ng new` generates a welcome page in `src/app/app.html` plus matching component styles. Replace them with a minimal baseline so the app starts from a blank slate:

- `src/app/app.html` — replace with `<router-outlet />` if routing was enabled in step 2, otherwise leave a single placeholder element (e.g. `<h1>{{ title() }}</h1>`). Delete all the generated welcome markup, logo SVGs, and documentation links.
- `src/app/app.{scss,css,less}` — empty the file. The welcome-page styles are scoped to content that no longer exists.
- `src/app/app.ts` — remove any imports that were only used by the welcome template (e.g. `RouterLink` if it was imported solely for the nav links). Keep `RouterOutlet` when routing is enabled.
- `src/styles.{scss,css,less}` — replace the empty file with a single `@use` of the reset partial added below (see **Global reset stylesheet**).

**Global reset stylesheet** — create `src/styles/_reset.scss` with the content below, then import it from `src/styles.scss` so it applies to every component. The reset uses `@layer reset` so any later component-level styles or a theme layer remain authoritative. It references CSS variables (`--fg-theme-primary`, `--fill-theme-primary`) that a later theme layer is expected to define — when undefined the browser falls back to its own defaults, so the reset is safe to ship before a theme exists.

`src/styles/_reset.scss`:

```scss
@layer reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
      sans-serif;
    color: var(--fg-theme-primary);
    background: var(--fill-theme-primary);
    line-height: 1.5;
  }
}
```

`src/styles.scss` (wire the partial in):

```scss
@use 'styles/reset';
```

If the project was scaffolded with `--style=css` or `--style=less`, translate the partial to that syntax. SCSS is the default and preferred choice.

## 4. Verify the build

Run `npm run build` to confirm the scaffold compiles, and repair any errors.

Do **not** run `npm start` / `npx ng serve` — it is a long-running process that will block the session.

## 5. Install ESLint (required baseline)

Linting with Angular-aware rules. Catches unused imports, template issues, lifecycle misuse, and `any` leaks. Output is machine-readable, so the agent can read it and self-correct.

Install the schematic and the extra plugin:

```
npx ng add @angular-eslint/schematics --skip-confirmation
npm install -D eslint-plugin-unused-imports
```

Replace the generated `eslint.config.js` at the workspace root with the template at [`references/eslint.config.template.md`](references/eslint.config.template.md). It enables:

- **Errors**: `@angular-eslint/prefer-standalone`, `@typescript-eslint/no-explicit-any`, `unused-imports/no-unused-imports`, `@angular-eslint/template/no-negated-async`
- **Warnings**: `@angular-eslint/no-empty-lifecycle-method`, `@angular-eslint/use-lifecycle-interface`, `@typescript-eslint/no-unused-vars` (with `^_` ignore), `@angular-eslint/prefer-signals`
- **Type-aware linting** via `parserOptions.projectService: true`
- **Ignores**: `dist/`, `node_modules/`, `.angular/`

After replacing, run `npm run lint` to confirm the config loads cleanly.

Component libraries, charting libraries, state management libraries, and any other third-party Angular packages are **not** installed at scaffolding. A specific library is wired up only when a feature's requirements call for it.

## 6. Standard npm scripts

Every command the agentic flow issues must go through a `package.json` script so the runtime behavior is identical in CI, on a fresh clone, and inside Claude. `ng new` seeds `start`, `build`, `watch`, `test`. Two adjustments before returning from this skill:

**Make `npm test` non-interactive** — Angular's default `"test": "ng test"` is watch-mode and will block a non-interactive session. Update `package.json` to:

```json
"test": "ng test --watch=false"
```

A developer who wants watch mode can run `npx ng test` directly.

**Register the `lint` script** — `ng add @angular-eslint/schematics` does not always add a `lint` script. After ESLint install, verify `package.json` contains — and add it if missing:

```json
"lint": "ng lint"
```

The final script inventory the flow relies on:

| Command | Script | When used |
|---|---|---|
| `npm run build` | `ng build` | Quality gate. Must pass clean at the end of every implementation phase. |
| `npm run lint` | `ng lint` | Quality gate. Must pass clean at the end of every implementation phase. |
| `npm test` | `ng test --watch=false` | Smoke-test gate. Runs Vitest via Angular's `@angular/build:unit-test` builder. Do **NOT** call `npx vitest run` directly — it bypasses Angular's compile step, globals, and `TestBed.initTestEnvironment`, and fails with `describe is not defined` / `TestBed.initTestEnvironment()` errors. |
| `npm start` | `ng serve` | Dev server. Long-running and interactive — **never** used in agentic flow. |

Every command issued in the agentic flow goes through these scripts by name — do not substitute `npx ng ...` direct calls.
