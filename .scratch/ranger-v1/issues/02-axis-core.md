# 02 — Axis core: DOM-free value logic

Status: ready-for-agent
Blocked by: 01
Spec: [../spec.md](../spec.md) §5.1, §5.2 · [ADR-0002](../../../docs/adr/0002-inferred-ordinal-and-numeric-axes.md) · [ADR-0003](../../../docs/adr/0003-value-based-v-model-and-unset-state.md)

## Goal

Every value/position decision as pure functions with no DOM access, fully unit-tested. This is where the bugs live; the component should end up as a thin shell over it.

## Scope

`src/axis.ts`. The seam — agreed before any test was written, and narrower than this ticket originally proposed:

**Public**

- `resolveAxis(props): Axis` — infers ordinal vs numeric from `stops` / `min` / `max` (ADR-0002), normalises stops, drops invalid ones, and returns its complaints as `axis.diagnostics`.
- `resolve(axis, value): Resolved` — `{ value, stop, index, position, nearest }`. Serves the `change` payload, the CSS position, the thumb tint and `aria-valuetext` in one call.
- `positionToValue(axis, position, from): Value` — snaps to stop or step and skips disabled stops. **Takes the current value**, because "if no enabled stop exists in that direction, the value does not move" is undecidable without knowing where the thumb came from. With no previous value it falls back to the nearest enabled stop.
- `warn(diagnostics)` — the only impure part: prints, and is what gets stripped from production builds.

**Internal**, exercised through `resolve` rather than tested directly: `valueToPosition`, `nearestStop`.

Diagnostics are **returned as data**, not written to `console` from inside the core, so the tests stay pure and "fires exactly once per condition" is a property of the returned array rather than a spy call count. Codes required: contradictory axis props; a numeric axis whose stops lack `at`; pinned stops outside `[min, max]`; duplicate stop `value`s; a `modelValue` matching no stop; no `stops` and no `min`/`max`.

## Acceptance criteria

- 100% of branches in `axis.ts` covered by tests that import nothing from `vue` and touch no DOM.
- Ordinal: 6 stops → positions `0, .2, .4, .6, .8, 1`; a single stop → `0`.
- Numeric: `min 0 max 100 step 5`, a drag at position `0.43` resolves to `45`; values clamp at both ends.
- `null` resolves to `{ value: null, stop: null, index: -1 }` and is never coerced to a midpoint (the vlider bug in ADR-0003).
- Disabled stops are never returned by `positionToValue`; if a direction has no enabled stop, the value is unchanged.
- Warnings fire exactly once per distinct condition and are absent from a production build.

  **How this landed:** `warn()` is guarded by `import.meta.env.DEV`, so the `console.warn` call and the `[ranger]` message strings are gone from `dist/` (verified by grep). Detection is _not_ stripped: `resolveAxis` still returns `diagnostics`, so the diagnostic codes appear in the bundle. That is deliberate — diagnostics are returned data, and making detection dev-only would give `resolveAxis` different behaviour in development and production. Revisit only if the few hundred bytes matter.

## Known limitations, deliberately left

- **Disabled ticks on a numeric axis are not skipped.** `positionToValue` honours `disabled`
  on an ordinal axis only. What "disabled" even means for one tick on a continuous range is
  undecided - the values either side of it are still selectable - so issue 07 owns the
  semantics rather than this module inventing them.
- **Five `axis.kind === 'numeric'` branch points** (`resolveAxis`, `valueToPosition`,
  `placeStops`, `resolve`, `positionToValue`). Two axis strategy objects would collapse
  them. Deferred to issue 03, which is the first real consumer and the point at which the
  duplication either hurts or does not.

## Out of scope

Any rendering, any Vue reactivity, any event emission.
