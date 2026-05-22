# Resetting Reactive Forms — model vs directive

Reactive Forms have **two** reset surfaces, and they don't reset the same things. Pick the wrong one and the form fields look clean but `ng-submitted` stays applied, validation errors keep painting red, and CSS keys off the wrong state.

## The two methods

| API | What it resets | What it doesn't |
| --- | --- | --- |
| `formGroup.reset(value?)` (model) | Control values, validation status, pristine/untouched flags. | The `submitted` state on the form **directive**. CSS class `ng-submitted` stays applied. |
| `@ViewChild(FormGroupDirective) ngForm.resetForm(value?)` (directive) | Everything `reset()` does, **plus** the `submitted` state. CSS class `ng-submitted` is removed. | (Nothing else of consequence.) |

If your form's CSS or template uses `ng-submitted` to decide whether to show errors (the standard pattern), you almost always want `resetForm()`, not `reset()`.

## Standard "reset after successful submit"

```ts
@Component({
  selector: 'app-edit-customer',
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" #ngForm="ngForm">
      <!-- ... fields ... -->
      <button type="submit">Save</button>
      <button type="button" (click)="onReset()">Reset</button>
    </form>
  `,
})
export class EditCustomer {
  @ViewChild('ngForm', { static: true }) private formDir!: FormGroupDirective;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
  });

  private initialValue = this.form.getRawValue();

  ngOnInit() {
    // After data loads, capture the new "initial" so Reset returns here.
    this.api.getCustomer(this.id).subscribe(data => {
      this.form.setValue(data);
      this.initialValue = this.form.getRawValue();
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.api.save(this.form.getRawValue()).subscribe(() => {
      this.initialValue = this.form.getRawValue(); // success → new "initial"
      this.formDir.resetForm(this.initialValue);    // model + directive
    });
  }

  onReset() {
    this.formDir.resetForm(this.initialValue);
  }
}
```

Two pieces worth highlighting:

- **`@ViewChild` of the `FormGroupDirective`**, not the form's element. The directive has the `submitted` state.
- **`initialValue` is captured after data loads, then refreshed on each successful save.** "Reset" means "back to the last known good state", not "back to construction". Forms populated from the server should track the post-load state as the "initial".

## `nonNullable` and what `reset()` actually puts back

By default, `new FormControl('foo')` is nullable, and `reset()` reverts the value to `null`. With `{ nonNullable: true }`, `reset()` reverts to the *initial value passed at construction* (`'foo'` here, or whatever was passed to `setValue` if the form has been re-seeded? — **no**: `nonNullable` reverts to the construction-time initial, not the latest set value).

```ts
// nullable default — reset() puts null.
new FormControl('hello').reset(); // → value === null

// nonNullable — reset() puts the construction-time initial.
new FormControl('hello', { nonNullable: true }).reset(); // → value === 'hello'
```

This means `nonNullable: true` + `reset()` is the wrong tool when you want "reset to the latest loaded data" — it'll go back to the bare construction value (`''` in most factory patterns), not what the API returned. Use `resetForm(initialValue)` and pass the captured value explicitly. This is the "Initial State Preservation Pattern" that survives "load from server, edit, hit Reset".

## Native `<button type="reset">` — why `preventDefault` matters

A bare `<button type="reset">` triggers the browser's native form reset, which wipes inputs **before** Angular's controlled state runs. The result: a flicker, then potentially incorrect values when Angular re-applies its model.

```html
<form [formGroup]="form" (reset)="onNativeReset($event)">
  <button type="reset">Clear</button>
</form>
```

```ts
onNativeReset(e: Event) {
  e.preventDefault();
  this.formDir.resetForm(this.initialValue);
}
```

The `(reset)` event fires before the wipe; `preventDefault` stops the browser; the directive then resets through Angular's path. If you don't intercept, the user sees the values blink to empty and back.

## Reset to specific values vs. reset to construction defaults

Both `reset()` and `resetForm()` accept an optional value object. Keys must match control names; missing keys revert to the field's default (or `null` if nullable).

```ts
// Reset to known state.
this.formDir.resetForm({ name: '', email: '' });

// Reset keeping current values, just clearing the validation/submitted flags.
this.formDir.resetForm(this.form.getRawValue());

// Reset to the captured initial state.
this.formDir.resetForm(this.initialValue);
```

The "keep values, clear flags" form is occasionally what you want — e.g. after a `save` that didn't navigate away.

## Anti-patterns

- **`this.form.reset()` on a submitted form** — values clear, but `ng-submitted` is sticky, so the error state CSS stays applied. Visually unclean. Use the directive.
- **`getRawValue()` to capture the initial *before* the data loads** — captures empty defaults. Capture after the load resolves.
- **Relying on `nonNullable` to "remember" a loaded value across resets** — it remembers the construction value, not the latest. Use captured-state + `resetForm(initial)`.
- **Native `<button type="reset">` without intercepting `(reset)`** — flicker; potentially wrong state.
- **Two reset paths in the same component** — one calling `form.reset()` from a component method, one from a native button. Inconsistent results. Pick one path.

## What to grep for

- `\.reset\(\)` on a `FormGroup` (not a directive) — likely a candidate to upgrade to `resetForm()`.
- `<button type="reset">` without `(reset)=` — native-flicker risk.
- `getRawValue\(\)` captured in the constructor / field initializer (instead of post-load) — wrong "initial" state.
