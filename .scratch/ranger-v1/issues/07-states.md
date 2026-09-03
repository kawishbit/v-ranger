# 07 — Disabled, readonly and unset states

Status: ready-for-agent
Blocked by: 03, 05
Spec: [../spec.md](../spec.md) §5.2 · [ADR-0003](../../../docs/adr/0003-value-based-v-model-and-unset-state.md)

## Goal

Three states that every other feature has to account for, done once and tested together.

## Scope

- **Unset** (`modelValue === null`): desaturated track, no fill, thumb parked at the start (or hidden), `data-unset` on the root, `--ranger-unset-*` tokens, `thumb` slot receiving `unset: true`. The component must **not** emit on mount, and must never coerce `null` to the midpoint — that was vlider's bug (ADR-0003).
- **Disabled**, whole slider: engine `disabled`, `data-disabled`, `--ranger-disabled-opacity`, no pointer or keyboard changes, labels not clickable.
- **Disabled, per stop**: keyboard and pointer skip it; a drag landing on it settles on the nearest enabled stop; if there is none in that direction the value does not move; conveyed non-visually as well.
- **Readonly**: renders normally, stays focusable and announced, refuses every value change. Distinct from disabled in both looks and semantics.

## Acceptance criteria

- Rendering `<Ranger :stops="…" />` with no `v-model` emits nothing until the user interacts.
- The unset rendering is visually distinguishable from every real selection, including the middle one.
- A disabled middle stop is unreachable by arrow keys, by drag, and by clicking its label.
- `readonly` keeps the engine focusable and `aria-valuetext` announced; `disabled` does not.
- Every state carries the documented data attribute so consumers can style it with tokens alone.

## Out of scope

Form-library integration and validation messaging — the consumer's job.
