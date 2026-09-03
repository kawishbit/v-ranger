# ADR-0003: `v-model` carries the stop's value, and `null` means unset

- **Status:** Accepted
- **Date:** 2026-09-04

## Context

vlider's `v-model` carried a **1-based index**: the native input ran `min="1"` to `max="{stops.length}"`, so `3` meant `stops[2]`. Two problems followed.

First, indices are positional. Reorder, filter or splice the stops array and every stored value silently means something else — including values already persisted in a database. Consumers ended up writing `stops[value - 1].label` at every call site, and the `- 1` is a permanent off-by-one hazard.

Second, vlider initialised its internal value to `null` and handed it to a native input, which coerces a non-numeric value to the **midpoint** of its range. The thumb therefore rendered in the middle of the track while the model said "nothing selected". For the component's most common application — asking someone how they feel — an unanswered question became indistinguishable from a deliberate neutral answer, in the direction that silently invents data.

## Decision

**`v-model` carries the stop's own `value`** on an ordinal axis (`'angry'`, `3`, an object key — whatever the author put there) and a `number` on a numeric axis. Never an index. Never 1-based anything.

**`null` is a first-class unset state.** When `modelValue` is `null`:

- No stop is the selected stop.
- The presentation layer renders a visually distinct unset appearance (desaturated track, no fill, thumb parked at the start or hidden), driven by `--ranger-unset-*` tokens, exposed as `data-unset` on the root for state-based styling, and overridable through the `thumb` slot.
- The component emits **only** in response to real user interaction — never on mount, and never as a side effect of rendering.
- `aria-valuetext` announces that nothing is selected rather than announcing a number.

Alongside `update:modelValue`, the component emits **`change` with the resolved stop object**, so consumers get the label and colour they just landed on without re-searching the array.

A `modelValue` that matches no stop is a developer error: warn in development and render as unset rather than guessing.

Used without `v-model`, a Ranger starts unset and tracks its value internally.

## Consequences

**Positive**

- `v-model="mood"` reads `'angry'`. Stored values survive reordering the stops.
- "Did the user actually answer?" is answerable, which is the single most common question asked of a survey slider.
- No emit-on-mount, so the component is safe to render inside a form without dirtying it.

**Negative**

- Value → position requires a lookup, so stop `value`s must be unique. Duplicates are a development-time warning.
- Consumers who genuinely want an index must derive it, and the migration path from vlider is a breaking change (documented in a migration table).
- The unset state is a third rendering mode that every visual feature — gradient, thumb tint, focus ring, disabled — has to account for, and every test suite has to cover.

## Alternatives considered

**0-based index as the model value.** Fixes the off-by-one but not the positional fragility, and still forces `stops[value]` at every call site.

**No unset state; clamp `null` to the first stop.** Simpler by one rendering mode, and rejected precisely because it re-creates vlider's bug in a tidier form — it answers a question the user didn't answer.

**A separate `unset`/`empty` boolean prop.** Rejected as redundant with `null` and capable of contradicting it.
