# Encapsulation-first design for components and services

A design rule: **default every property and method to `private`**, and escalate to `protected` (template-bound) or `public` (deliberate API) only when something specific demands it. The visibility decision becomes intentional rather than accidental.

The payoff is structural: state mutations go through controlled paths, the public API is small and stable, and tests target observable behaviour instead of internal shape. The cost is a few extra characters per declaration.

## The rule

| Default | Where it applies |
| --- | --- |
| `private` | Everything that doesn't need to be reached from elsewhere — internal state, helper methods, captured DI references that the consumer shouldn't see. |
| `protected` | Members the **template** binds to: signals read in `{{ … }}`, methods called from `(click)=…`, computed values rendered in control flow. Not reachable from outside the component class. |
| `public` | A documented contract: a method a parent triggers via `@ViewChild`, an injected service's update method, an output the consumer subscribes to. Only when escalation is justified. |

## Services: hide the source of truth

The signals reactivity model only works if state changes go through `set` / `update`. Direct mutation of the underlying object bypasses the reactivity graph — `computed` values and `effect`s won't fire.

```ts
// BAD — public writable signal lets consumers mutate the value directly.
@Injectable({ providedIn: 'root' })
export class WidgetService {
  public config = signal({ width: 'small', layout: 'grid' });
}

// In a consumer:
this.svc.config().width = 'full-size';   // silent: bypasses reactivity, broken UI updates.
this.svc.config.set({ width: 'full' });  // works, but anyone can do this — no validation, no logging.
```

```ts
// GOOD — private signal, public read-only view, gated mutation.
@Injectable({ providedIn: 'root' })
export class WidgetService {
  private readonly _config = signal<WidgetConfig>({ width: 'small', layout: 'grid' });

  /** Read-only public view. Consumers can read but not write. */
  readonly config = this._config.asReadonly();

  /** Single, validated mutation path. */
  setConfig(next: Partial<WidgetConfig>) {
    if (!this.validate(next)) throw new Error('Invalid widget config');
    this._config.update(c => ({ ...c, ...next }));
    this.persistAfterChange();
  }

  private validate(c: Partial<WidgetConfig>): boolean { /* ... */ return true; }
  private persistAfterChange() { /* HTTP, telemetry, ... */ }
}
```

The shape:
- **Private writable signal** owns the source of truth.
- **Public read-only signal** (`asReadonly()`) lets consumers `effect`/`computed` against the value but not write.
- **Public method** is the only way to change state, and is the natural place to add validation, logging, or downstream side effects.

When the public view is a *derivation* of internal state, `computed()` is the equivalent: `readonly displayName = computed(() => this._user().firstName + ' ' + this._user().lastName);`

## Components: `protected` for template-bound members

Component members read by the template can't be `private` — Angular's template compiler can't access private fields. But they don't have to be `public` either. `protected` lets the template bind while keeping the field hidden from external class instances (parent components holding a `@ViewChild` reference, services receiving the component, tests using `as any`).

```ts
@Component({
  template: `
    <button (click)="toggle()">{{ label() }}</button>
    @if (isOpen()) { <ng-content /> }
  `,
})
export class CollapsibleSection {
  protected readonly isOpen = signal(false);
  protected readonly label = computed(() => this.isOpen() ? 'Collapse' : 'Expand');

  protected toggle() { this.isOpen.update(v => !v); }

  /** Public — parent reaches in to programmatically expand/collapse. */
  open() { this.isOpen.set(true); }
  close() { this.isOpen.set(false); }
}
```

`isOpen` and `toggle` are template-only; a parent with `@ViewChild(CollapsibleSection)` can't write to `isOpen` or call `toggle()` directly. `open()` / `close()` are the deliberate parent-callable API.

## Why direct mutation breaks reactivity

A `signal()` value is only reactive when read **inside** a tracking context (`computed`, `effect`, template binding). Reading the signal returns the underlying object reference. Mutating that reference is a plain JavaScript operation — Angular has no hook into it. `computed` values that depend on the signal don't recompute; `effect` doesn't fire.

```ts
const items = signal<{ name: string }[]>([]);
const count = computed(() => items().length);

items().push({ name: 'a' });   // mutation — count() does NOT update.
items.set([...items(), { name: 'a' }]); // immutable update — count() updates correctly.
```

This is the structural reason the encapsulation rule matters: an exposed signal makes the mutation footgun reachable from anywhere. A private signal + public mutation method makes the immutable update the only path.

## Testing through the public API

Encapsulation makes tests resilient to refactors. Test what an external caller can do, not the internal shape.

- **Service**: trigger a public method, assert the public state. To test a private validation rule, call the public `setConfig({ … })` with invalid input and assert it throws.
- **Component**: render the component, simulate a user event in the template, assert DOM changes. The template is the public API — `fixture.nativeElement.click()` and `harness.click()` are the test's interaction surface.
- **Injected dependencies**: don't expose the dependency to the test by making it `public`. Re-inject through the test's `TestBed.inject(MyDep)` and spy there.

```ts
// BAD — making private public to test it.
class Svc { /* ... */ private validate(c) { /* ... */ } }
it('rejects invalid', () => expect((svc as any).validate({}).toBe(false)));

// GOOD — test through the public surface.
it('rejects invalid', () => expect(() => svc.setConfig({ width: 'oops' })).toThrow());
```

The test still covers the validation, but it survives "I renamed validate() to assertValid() internally" — the public method is unchanged.

## When public is the right choice

Public is justified when something **outside** the class needs to call it. Examples:

- **Service mutation methods** — the whole point is consumers can call them.
- **Service read-only signals** — consumers read these in `computed` / templates / effects.
- **Component methods called by a parent via `@ViewChild`** — `componentRef.reload()`, `tabsRef.selectByIndex(2)`.
- **Outputs** (`output()`) — by definition consumed by the parent template.

These should still be the *minority* of declarations on the class. If most fields are public, the encapsulation has slipped.

## Anti-patterns

- **Public writable signal**, exposed for "convenience". Bypasses the reactivity contract; consumers can mutate the underlying object and break dependents silently.
- **`public` for testing.** Don't widen visibility to make a test easier; widen the public API to do something the test can hit.
- **Renaming a private method to make it public, then leaving it that way.** The class has now grown a public surface for an internal reason. Roll back; restructure the test.
- **`@HostBinding`/`@HostListener` on public methods.** Decorators don't care about visibility; `protected` works fine and keeps the method off the external API.
- **Reaching into `(component as any).privateField` in a test.** Symptom of testing implementation details. Find a public path; if there isn't one, that's a hint the public API is too small for the use case.

## Why the discipline pays off

Encapsulation isn't pedantry — it makes refactor safe. Renaming a private method, splitting a service into two, changing a signal to a computed: none of these break consumers if the public API is unchanged. Without the discipline, every internal change is a breaking change, because *something* outside the class might be reaching into the internals.

Default to private. Escalate when the use case demands it. The cost is six characters; the saving is a class that can be evolved without breaking everything that touches it.
