# 15 — Paint the gradient ramp immediately, even while unset

Status: resolved
Blocked by: None (can start immediately)
Spec: [../spec.md](../spec.md) §5.4 · [ADR-0003](../../../docs/adr/0003-value-based-v-model-and-unset-state.md)

## Goal

A freshly mounted Ranger with no value chosen yet (`modelValue` unset, or no `v-model` at
all — the common case, since uncontrolled use starts unset) renders a flat, colourless
track until the first interaction. That was a deliberate call in issue 07 — "an
unanswered one does not paint it" — but it reads as a missing gradient rather than a
considered state, and it means the component looks unfinished on first paint in most of
its own demos. The track should show its full colour from the moment it mounts.

## Scope

- Drop the unset-state rule that flattens the track to `--ranger-unset-track-color`
  (`.ranger[data-unset] .ranger__track`, in `src/ranger.css`). The ramp paints the same
  whether or not a value has been chosen.
- The thumb stays the one visual cue for unset: still faded (`--ranger-unset-opacity`)
  and parked at the start, untinted. That is what keeps unset distinguishable from a
  real selection at the first stop's position — the acceptance bar issue 07 set — now
  carried entirely by the thumb instead of by the thumb plus the flat track.
- `--ranger-unset-track-color` stops doing anything for the track once this ships; decide
  whether to remove the token and its default, or leave it declared-but-unused for a
  consumer who still reads it via `--ranger-track-color` some other way, and record the
  choice.
- Update [ADR-0003](../../../docs/adr/0003-value-based-v-model-and-unset-state.md) and
  issue 07's own record to reflect the new unset appearance, since both currently
  describe the flat track as intended behaviour.
- Update the existing tests that assert an unset Ranger paints no ramp (issue 04's colour
  fixture, issue 07's states suite) to assert the new behaviour instead.

## Acceptance criteria

- `<Ranger :stops="…" />` with no `v-model` shows its full gradient on the track from the
  very first paint, with no interaction required.
- The unset state is still visually distinguishable from a real selection sitting at the
  first stop — via the faded, parked thumb — even though the track no longer differs.
- `aria-valuetext` still announces "no selection" while unset (unchanged); this ticket is
  visual only.

## Out of scope

Giving the playground's example components a starting value — that's a separate,
optional follow-up now that the flat-track motivation for it is gone, not something this
ticket needs to do.

## Comments

**Resolved.** The unset-state rule that painted `.ranger__track` flat
(`background-image: none; background-color: var(--_unset-track-color)`) is gone from
`src/ranger.css`; the track now always paints `--_gradient`, unset or not. The faded,
parked thumb (`--_unset-opacity`, already parked at position 0 while unset) is now the
whole of the visual distinction.

**`--ranger-unset-track-color` was removed outright**, not left declared-but-unused: spec
§6 treats the token list as exact public API (`tests/unit/tokens.test.ts` and
`site/scripts/verify-drift.mjs` both fail on drift from it), and a token that no longer
paints anything is a worse trap than a documented removal. Dropped from the CSS (the
alias and all three theme-scheme re-declarations), spec §6, README.md, and
`site/tokens.md`.

ADR-0003 and issue 07's own record both described the flat track as intended; both now
note it was superseded by this ticket, with the thumb alone carrying the distinction.

`tests/browser/states.test.ts`'s `unset` describe block was rewritten: the test that
asserted "no ramp while unset" now asserts the ramp is identical whether set or unset, the
test that compared unset-vs-middle track images now only compares thumb position, and the
token-restyling test for the track colour was removed (nothing reads that token any more).
A stale comment in `tests/browser/ranger.test.ts` referencing the old flat-track behaviour
was also corrected.
