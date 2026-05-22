# RxJS unsubscription in Angular

Three operators handle "stop this stream when the host goes away": `takeUntil`, `takeUntilDestroyed`, and (implicitly) `toSignal` / `async` pipe. Pick one per stream. Place it correctly. Most "memory leak in switchMap" bugs are operator-order bugs in disguise.

## Decision flow

| Where the stream lives | Use this | Why |
| --- | --- | --- |
| Component / directive / service in injection context | `takeUntilDestroyed()` (no arg) | Auto-binds to `DestroyRef`. No subject to manage. |
| Outside injection context (a method called later) | `takeUntilDestroyed(destroyRef)` | Pass the `DestroyRef` you captured earlier in the constructor. |
| Pre-Angular-16 codebase | `takeUntil(this.destroy$)` | The pre-`DestroyRef` shape, with the `Subject` boilerplate. |
| Value flows into the template | `async` pipe | Auto-unsubscribes via the directive's destroy hook. |
| Value needs to be a Signal in TS | `toSignal(stream$)` | Auto-unsubscribes via the captured `DestroyRef`. |

The right answer most often is `toSignal` or `async`. Reach for explicit unsubscription only when the stream has *side effects* you want to stop — a timer, an analytics call, a websocket — and there's no view binding to do it for you.

## Why operator order matters

Completion travels **downstream** (toward the subscriber); teardown logic travels **upstream** (back through the pipe, unsubscribing inner streams). `takeUntil` works by completing the source on a notifier emit. Anything **above** `takeUntil` in the pipe gets its teardown invoked. Anything **below** does not — it's already been told the stream completed; it doesn't get a "and tear down your inner state" signal.

That means: **`takeUntil` must be the last operator in the pipe.** Otherwise, operators downstream of it (typically `switchMap`, `mergeMap`, etc.) keep their inner subscriptions alive after the host is destroyed.

```ts
// LEAK — switchMap is downstream of takeUntilDestroyed.
this.dataSvc.id$.pipe(
  takeUntilDestroyed(),                    // completes the stream on destroy
  switchMap(id => this.http.get(`/x/${id}`)) // inner http never gets teardown
).subscribe();

// GOOD — takeUntilDestroyed is last; switchMap's inner http teardown fires.
this.dataSvc.id$.pipe(
  switchMap(id => this.http.get(`/x/${id}`)),
  takeUntilDestroyed()
).subscribe();
```

Same rule for `mergeMap`, `concatMap`, `exhaustMap`, `audit`, `debounce`, `delay` — anything that holds an inner subscription or a pending timer.

## The exception: terminal-on-completion operators

A handful of operators **emit on completion**: `last()`, `takeLast(n)`, `toArray()`, `reduce()`, `count()`, `min()`, `max()`. They need the source to complete before they fire. If you place `takeUntil` *after* one of these, the operator never sees its emission — `takeUntil` swallows the completion event before the operator's terminal logic runs.

```ts
// "On destroy, emit the count of how many values we received."
source$.pipe(
  takeUntil(this.destroy$),
  count(),               // ← runs AFTER takeUntil — fires on completion
).subscribe(n => log(n));

// "Count up to destroy time, then ALSO stop the source." — same code; it's correct.
```

Rule of thumb: terminal operators that emit on completion go **after** `takeUntil`. Everything else goes **before**.

## `takeUntilDestroyed` outside injection context

`takeUntilDestroyed()` with no argument needs to be called inside an injection context (constructor, factory, `runInInjectionContext`). If you want to use it inside a method called later, capture `DestroyRef` once and pass it:

```ts
@Component({ /* ... */ })
export class HeavyView {
  private readonly destroyRef = inject(DestroyRef);

  startPolling() {
    interval(1000).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(/* ... */);
  }
}
```

## When `toSignal` is the right answer

`toSignal(stream$)` registers an internal subscription, captures `DestroyRef` automatically, and exposes the latest emission as a signal. Use it when:

- The stream's value is something the template (or `computed`) reads — instead of pushing into a manual `signal()` from a subscription.
- You want `async`-pipe-style auto-cleanup without the pipe (because the value is consumed in TS, not the template).
- You're migrating an `Observable`-based service into the signals world — `toSignal` is the bridge.

`toSignal` does **not** apply if the only reason you subscribed was a side effect. Side effects belong in `tap` (logging) or in an explicit `subscribe` with `takeUntilDestroyed` cleanup.

## Manual subscription bookkeeping (when nothing else fits)

If you're stuck on a pre-`DestroyRef` codebase or have a stream owned by a non-Angular construct:

```ts
private readonly subs = new Subscription();

ngOnInit() {
  this.subs.add(this.a$.subscribe(/* ... */));
  this.subs.add(this.b$.subscribe(/* ... */));
}

ngOnDestroy() { this.subs.unsubscribe(); }
```

The "master subscription" pattern. Imperative, easy to forget to `.add(...)` to. Don't reach for it when `takeUntilDestroyed` works.

## Anti-patterns

- **`takeUntil(destroy$)` in the middle of the pipe** with `switchMap` after — the canonical leak. Move `takeUntil` to the end.
- **`takeUntilDestroyed()` called from a setter or a method**, not the constructor, with no `DestroyRef` argument — throws "outside injection context" at runtime.
- **Mixing `takeUntilDestroyed()` and the `Subject`+`takeUntil` pattern in the same component**. Pick one. Inconsistency makes future readers double-check every stream.
- **Subscribing inside a subscription** (`a$.subscribe(v => b$.subscribe(...))`) — even `takeUntilDestroyed` on the outer doesn't tear down the inner. Use a flattening operator (`switchMap`, etc.) instead.
- **Forgetting that `async` pipe and `toSignal` already handle unsubscription**, then adding `takeUntilDestroyed` "for safety". It's a no-op visually; it does add a layer of operator-ordering risk.

## Quick audit

When reviewing an Angular file for unsub bugs:

1. Find every `.subscribe(`. Walk up the pipe.
2. The last operator before `subscribe` should be `takeUntilDestroyed()` or `takeUntil(...)` — *unless* the stream completes naturally (`http.get(...)`, `take(1)`, `first()`).
3. Anything after `takeUntil` that isn't a terminal-on-completion operator is suspect.
4. If the value is consumed only in the template, prefer `async`. If it's consumed in TS as a signal, prefer `toSignal`.
