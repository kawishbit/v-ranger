# 02 — Axis core: DOM-free value logic

Status: ready-for-agent
Blocked by: 01
Spec: [../spec.md](../spec.md) §5.1, §5.2 · [ADR-0002](../../../docs/adr/0002-inferred-ordinal-and-numeric-axes.md) · [ADR-0003](../../../docs/adr/0003-value-based-v-model-and-unset-state.md)

## Goal

Every value/position decision as pure functions with no DOM access, fully unit-tested. This is where the bugs live; the component should end up as a thin shell over it.

## Scope

`src/axis.ts` exporting:

- `resolveAxis(props): Axis` — infers ordinal vs numeric from `stops` / `min` / `max` (ADR-0002), normalises stops, drops invalid ones.
- `valueToPosition(axis, value): number` — `0..1`; the unset value maps to the axis start but is flagged, not silently zeroed.
- `positionToValue(axis, position)` — snaps to stop or step; skips disabled stops.
- `nearestStop(axis, position): { stop, index } | null`.
- `resolve(axis, value): Resolved` — the `{ value, stop, index, position }` payload of the `change` event.
- `warn(...)` — dev-only diagnostics, wrapped so bundlers strip them from production builds.

Dev warnings required: contradictory axis props; a numeric axis whose stops lack `at`; pinned stops outside `[min, max]`; duplicate stop `value`s; a `modelValue` matching no stop; no `stops` and no `min`/`max`.

## Acceptance criteria

- 100% of branches in `axis.ts` covered by tests that import nothing from `vue` and touch no DOM.
- Ordinal: 6 stops → positions `0, .2, .4, .6, .8, 1`; a single stop → `0`.
- Numeric: `min 0 max 100 step 5`, a drag at position `0.43` resolves to `45`; values clamp at both ends.
- `null` resolves to `{ value: null, stop: null, index: -1 }` and is never coerced to a midpoint (the vlider bug in ADR-0003).
- Disabled stops are never returned by `positionToValue`; if a direction has no enabled stop, the value is unchanged.
- Warnings fire exactly once per distinct condition and are absent from a production build.

## Out of scope

Any rendering, any Vue reactivity, any event emission.
