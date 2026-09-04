# 07 — Disabled, readonly and unset states

Status: resolved
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

## Comments

**Resolved.** 250 tests (188 unit, 62 browser), typecheck, lint and `npm run build` clean,
including the declaration build.

### Decisions taken during implementation

- **An unset track paints no ramp at all**, taking the flat `--ranger-unset-track-color`
  instead — the ticket's "desaturated track", read literally, and the only reading that gives
  `--ranger-unset-track-color` anything to do. A muted-but-colourful ramp was the alternative;
  it makes the state weaker exactly where it matters, since "visually distinguishable from
  every real selection" is what stops a survey reading an unanswered question as a neutral
  answer. One issue-04 browser test used an unset Ranger as its colour fixture and now passes
  a value: its subject is what happens with no *colour* configured, not what an unset one
  paints.
- **The unset thumb fades but is not hidden.** `(or hidden)` was on offer in the ticket; a
  thumb that disappears leaves nothing to drag and nothing for the focus ring to sit on.
  Faded, untinted and parked at the start is distinct enough — and it is already untinted,
  because `--ranger-active-color` is left unset while there is no answer (issue 04).
- **The whole-Ranger fade sits on the root and the per-stop fade excludes it,** so a disabled
  stop inside a disabled Ranger is not faded twice. Compounded opacity is the kind of thing
  nobody notices until a label is unreadable.
- **A disabled stop is struck through as well as faded.** Spec §7 forbids contrast carrying
  meaning on its own, so `text-decoration: line-through` on the label is the visible half and
  the `unavailable` in `aria-valuetext` (issue 06) is the other. The stop *marker* also
  carries `data-disabled` and dims with it, because a Ranger with `showLabels: false` and
  `showIcons: false` has no block to carry either.
- **`aria-readonly` is set by hand.** HTML's `readonly` does not apply to `type="range"`, so
  without it a reader is told the value can be changed. Its visual distinction from disabled is
  that there is none: readonly renders at full strength, and the only thing it takes back is
  the pointer cursor, since nothing it clicks will move.
- **The readonly refusal now covers the unset keyboard answer too** — issue 06 added a path
  where a key press commits the parked stop, and readonly has to refuse that one like every
  other.
- **Browser tests that tab now tab between sentinels.** `userEvent.tab()` on a page whose only
  control is disabled tabs out of the document entirely and takes the next test's focus with
  it. Two tests in issue 06's suite had the same latent fault and were hardened with it.

### Known limits, left as they are

- **A numeric tick's `disabled` still means nothing.** The axis core has never honoured it on
  a numeric axis — a continuous range has no "next enabled stop" to settle on — and spec §5.2
  describes disabled stops in ordinal terms. Fading a tick the keyboard walks straight over
  would be a worse lie than ignoring the flag.
- **`readonly` still emits nothing and still refuses everything**, but a drag over it moves
  the engine and snaps it back on the next tick, so a very fast reader can see a flicker. The
  fix is `pointer-events: none` on the engine, which would also take the focus ring's
  `:focus-visible` route away from a pointer user; issue 09 owns the interaction matrix and is
  where that trade belongs.
