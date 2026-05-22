# Clean RxJS in Angular — common errors and how to fix them

Six recurring shapes that show up in code review, with the corrected version next to each. Pair this with `rxjs-unsubscription.md` (operator order, `takeUntilDestroyed`) for the unsub-specific story.

## 1. Nested subscriptions

The most common smell. An outer stream's value drives an inner stream, and the inner is subscribed inside the outer's subscriber.

```ts
// BAD — leaves the reactive context, manual cleanup, no cancellation.
this.searchConfig$.subscribe(config => {
  this.users$ = this.userService.findUsers(config); // and the previous request keeps running
});

// GOOD — flatten with switchMap.
this.users$ = this.searchConfig$.pipe(
  switchMap(config => this.userService.findUsers(config))
);
```

Why `switchMap` here: when the search config changes, the previous user request is auto-cancelled. For "fire all and keep results" use `mergeMap`; for "queue them" use `concatMap`; for "ignore new arrivals while one is in-flight" use `exhaustMap`.

## 2. Reference equality on `distinctUntilChanged` for objects

Default `distinctUntilChanged` uses `===`. New object identity → not equal → emits. The "duplicates" you wanted to filter are still passing through.

```ts
// BAD — config$ emits {filter: 'x'} every keystroke, none equal each other.
config$.pipe(distinctUntilChanged());

// GOOD A — comparator function on the meaningful field.
config$.pipe(distinctUntilChanged((a, b) => a.id === b.id));

// GOOD B — when one key drives the change.
config$.pipe(distinctUntilKeyChanged('id'));

// GOOD C — full deep equality (more expensive; use when needed).
config$.pipe(distinctUntilChanged((a, b) => isEqual(a, b)));
```

For Angular signal-based filter pipelines, `distinctUntilObjectChanged()` (from the project's RxJS utils) wraps the deep-equality variant with a sensible default.

## 3. Side effects inside `map`

`map` is supposed to be pure. Putting `localStorage.setItem` or `analytics.track` inside it makes the operator do two things — silent drift from the function's name.

```ts
// BAD — map is no longer pure; resubscribers fire the side effect again.
source$.pipe(map(v => { localStorage.setItem('last', v); return v.toUpperCase(); }));

// GOOD — side effect in tap, transformation in map.
source$.pipe(
  tap(v => localStorage.setItem('last', v)),
  map(v => v.toUpperCase()),
);
```

## 4. Cold observables consumed twice (duplicate HTTP calls)

A naked `http.get(...)` is **cold** — every subscriber runs the request. Use the same observable in two `async` pipes (or two `subscribe` calls) and you've made two requests.

```ts
// BAD — two requests fire because the template uses |async twice.
@Component({
  template: `
    <p>{{ user$ | async | json }}</p>
    <p>{{ user$ | async | json }}</p>
  `,
})
class C { user$ = this.http.get('/me'); }

// GOOD — multicast the single execution to all subscribers.
class C { user$ = this.http.get('/me').pipe(shareReplay(1)); }
```

`shareReplay(1)` keeps the latest value cached and replays it to new subscribers, with one execution. For streams without a meaningful "latest", `share()` (no replay buffer) is enough.

When the consumer is in TS rather than the template, prefer `toSignal(http.get('/me'))` — it subscribes once and caches like `shareReplay(1)` for free.

## 5. Manual subscription in components

Wiring an `Observable` into a property via `subscribe(...)` and never unsubscribing is the #1 leak source.

```ts
// BAD — leaks; user count never stops updating, even after navigation away.
ngOnInit() {
  this.userCount$.subscribe(n => this.userCount = n);
}

// GOOD A — the template consumes it directly.
@Component({ template: `Users: {{ userCount$ | async }}` })

// GOOD B — convert to a signal at the boundary.
readonly userCount = toSignal(this.userCount$);

// GOOD C — explicit cleanup when the value is needed in TS for side effects.
this.userCount$.pipe(takeUntilDestroyed()).subscribe(n => this.persist(n));
```

`async` pipe and `toSignal` cover ~90% of cases. Reach for the explicit `subscribe` only when the value drives a *side effect* (a redirect, a toast, a localStorage write).

## 6. Misplaced `takeUntil` (memory leaks via `switchMap`)

Already covered in detail in `rxjs-unsubscription.md`. The summary: `takeUntil` / `takeUntilDestroyed` go **last** in the pipe, after every flattening operator, so their teardown reaches inner subscriptions.

```ts
// BAD — switchMap's inner http never gets teardown.
src$.pipe(takeUntilDestroyed(), switchMap(v => http.get(`/x/${v}`))).subscribe();

// GOOD — takeUntilDestroyed last; teardown propagates to switchMap.
src$.pipe(switchMap(v => http.get(`/x/${v}`)), takeUntilDestroyed()).subscribe();
```

## Stay in the reactive context

The unifying theme: prefer to keep data inside the pipe until the subscriber, not break out into property assignments midway through. Each break-out (`.subscribe(v => this.x = v)`, side effect inside `map`, manual subscription with no teardown) is a place where errors stop propagating, cancellation stops working, and the rest of the pipe can no longer help you.

Operator-side rules to internalize:

- `tap` for side effects (logging, persisting, analytics).
- `map` for pure transformations.
- `switchMap` / `mergeMap` / `concatMap` / `exhaustMap` for "outer value triggers an inner async".
- `shareReplay(1)` (or `toSignal`) for cached, multicast access.
- `distinctUntilChanged(comparator)` for object streams.
- `debounceTime` before HTTP calls driven by user input.
- `takeUntilDestroyed()` last, when explicit cleanup is needed.

## What to grep for during review

- `\.subscribe\(.*=>.*this\.` — manual property assignment from a subscription. Candidate for `async` / `toSignal`.
- `distinctUntilChanged\(\)` (no comparator) on object streams — likely a no-op.
- `subscribe\(.*\.subscribe\(` — nested subscriptions.
- `localStorage\.setItem|track\(|analytics\.` inside a `map(` — side effects in the wrong operator.
- `http\.\w+\(.*\)` directly returned to a template without `shareReplay` — multi-async-pipe risk.
