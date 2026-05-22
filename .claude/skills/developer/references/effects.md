# Side Effects with `effect` and `afterRenderEffect`

In Angular, an **effect** is an operation that runs whenever one or more signal values it tracks change.

## When to use `effect`

Effects are intended for syncing signal state to imperative, non-signal APIs.

**Valid Use Cases:**

- Logging analytics.
- Syncing state to `localStorage` or `sessionStorage`.
- Performing custom rendering to a `<canvas>` or 3rd-party charting library.

**CRITICAL RULE: DO NOT use effects to propagate state.**
If you find yourself using `.set()` or `.update()` on a signal _inside_ an effect to keep two signals in sync, you are making a mistake. This causes `ExpressionChangedAfterItHasBeenChecked` errors and infinite loops. **Always use `computed()` or `linkedSignal()` for state derivation.**

### If a signal write inside an effect is unavoidable, wrap it in `untracked()`

The "reset paginator state when filters change" shape is the most common offender: the effect tracks one input and resets several pieces of local state.

```ts
// bad — writes inside an effect with no untracked fence
effect(() => {
  this.filters();              // tracked dependency
  this.totalCount.set(0);
  this.rows.set([]);
  this.hasLoadedOnce.set(false);
});
```

The first preference is to **remove the effect entirely**:

- Reset-on-source-change → `linkedSignal({ source: this.filters, computation: () => 0 })` per target signal.
- Refetching data when filters change → `httpResource` / `resource` keyed on `this.filters`; the resource auto-resets and re-fires without any effect.

If the effect genuinely cannot be replaced (e.g. you must call an imperative non-signal API before the writes), declare the dependencies explicitly at the top and fence every write inside `untracked()`:

```ts
// good — explicit dependency, writes fenced inside untracked
effect(() => {
  this.filters();              // tracked dependency
  untracked(() => {
    this.totalCount.set(0);
    this.rows.set([]);
    this.hasLoadedOnce.set(false);
  });
});
```

Why the fence: by default Angular throws `NG0600: Writing to signals is not allowed in a 'computed' or an 'effect' by default. Use 'allowSignalWrites' in the 'CreateEffectOptions'…` the moment a `.set()` / `.update()` runs inside an effect's reactive context. Wrapping the writes in `untracked()` takes them out of that context — no flag needed and no error. The fence also prevents a subtler bug: `.update(prev => …)` reads the current value, and any signal read inside the writing block silently registers as another dependency, which can re-fire the effect as an infinite loop. 

## Basic Usage

Effects execute asynchronously during the change detection process. They always run at least once.

```ts
import { Component, signal, effect } from '@angular/core';

@Component({...})
export class Example {
  count = signal(0);

  constructor() {
    // Effect must be created in an injection context (e.g., a constructor)
    effect((onCleanup) => {
      console.log(`Count changed to ${this.count()}`);

      const timer = setTimeout(() => console.log('Timer finished'), 1000);

      // Cleanup function runs before the next execution, or when destroyed
      onCleanup(() => clearTimeout(timer));
    });
  }
}
```

## DOM Manipulation with `afterRenderEffect`

Standard `effect` runs _before_ Angular updates the DOM. If you need to manually inspect or modify the DOM based on a signal change (e.g., integrating a 3rd party UI library), use `afterRenderEffect`.

`afterRenderEffect` runs after Angular has finished rendering the DOM.

### Render Phases

To prevent reflows (forced layout thrashing), `afterRenderEffect` forces you to divide your DOM reads and writes into specific phases.

```ts
import { Component, afterRenderEffect, viewChild, ElementRef } from '@angular/core';

@Component({...})
export class Chart {
  canvas = viewChild.required<ElementRef>('canvas');

  constructor() {
    afterRenderEffect({
      // 1. Read from the DOM
      earlyRead: () => {
        return this.canvas().nativeElement.getBoundingClientRect().width;
      },
      // 2. Write to the DOM (receives the result of the previous phase)
      write: (width) => {
        // NEVER read from the DOM in the write phase.
        setupChart(this.canvas().nativeElement, width);
      }
    });
  }
}
```

**Available Phases (executed in this order):**

1. `earlyRead`
2. `write` (Never read here)
3. `mixedReadWrite` (Avoid if possible)
4. `read` (Never write here)

_Note: `afterRenderEffect` only runs on the client, never during Server-Side Rendering (SSR)._
