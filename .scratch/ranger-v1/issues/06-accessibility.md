# 06 — Accessibility to WCAG 2.2 AA

Status: resolved
Blocked by: 03, 05
Spec: [../spec.md](../spec.md) §7 · [ADR-0001](../../../docs/adr/0001-hybrid-native-range-input.md)

## Goal

A hard requirement, not a nicety, and the main reason ADR-0001 chose a native engine. vlider had no `aria-*` at all, click handlers on `<li>` elements, and `<label>`s with no `for`.

## Scope

- `aria-valuetext` on the engine: `"Astonished, 3 of 6"` on an ordinal axis; label plus number on a numeric one; an explicit "no selection" phrase when unset.
- `aria-valuemin`/`max`/`now` correct on both axes; an accessible name required (dev warning when neither `aria-label` nor `aria-labelledby` nor a wrapping `<label>` is present).
- Keyboard, verified by test rather than assumed: arrows step, Home/End jump to the extremes, PageUp/PageDown take a larger increment on a numeric axis, disabled stops are skipped.
- `:focus-visible` on the engine draws a ring on the thumb via `--ranger-focus-color`, meeting AA non-text contrast (≥3:1) against both the track and the surface.
- `prefers-reduced-motion: reduce` disables every transition (vlider hardcoded `transition: all 400ms`).
- Clickable labels and icons have a ≥24×24 CSS px target.
- Colour never carries meaning alone; disabled stops are conveyed non-visually as well as by opacity.
- Decorative presentation-layer nodes are `aria-hidden` and `pointer-events: none`, so the engine is the single thing exposed to assistive tech.

## Acceptance criteria

- `axe-core` reports zero violations on the ordinal, numeric, unset, disabled and readonly examples.
- A keyboard-only pass reaches and changes every enabled stop.
- Screen-reader output asserted via `aria-valuetext` snapshots for all five states.
- Focus ring contrast verified against the default tokens *and* the magenta recipe.
- With `prefers-reduced-motion: reduce` emulated, no element reports a non-zero transition duration.

## Out of scope

Visual regression snapshots (deferred past 1.0).

## Comments

**Resolved.** 223 tests (172 unit, 51 browser), `axe-core` clean on all five examples,
typecheck and lint clean, the DOM-free modules still at 100% branch coverage.

### Two real failures the acceptance criteria found

- **A wrapping `<label>` was naming a stop block, not the engine.** A `<label>` names its
  first labelable descendant, and a stop block is a `<button>` — which is labelable. With
  the blocks written first in the template, `<label>Mood <Ranger/></label>` named a
  decorative button nobody can reach and left the engine anonymous. Fixed by writing
  `.ranger__control` first in the template; which row each part is drawn in is the
  stylesheet's business, so nothing about the order is visible and no tab stop moved.
  A test asserts `label.control` is the engine.
- **The first stop was unreachable from the keyboard while unset.** An unset Ranger parks
  the engine at its minimum with no value, so `Home` and `ArrowLeft` move it nowhere, fire
  no `input`, and never produce the first stop. Now, while unset, the first value key
  answers with the stop the thumb is parked on and goes no further; every press after that
  steps normally. The rule is uniform across the keys rather than per key, because deciding
  which way the engine *would* have moved means re-deriving arrow behaviour that flips with
  the writing direction. The cost is that `End` on an unanswered Ranger chooses the first
  stop and has to be pressed twice.

### Decisions taken during implementation

- **No explicit `aria-valuemin`/`max`/`now`.** A range input has role `slider`, and a
  browser reports its own `min`, `max` and `value` as those three without being asked.
  Restating them would be a second place for them to be wrong, which is the whole of
  ADR-0001. A test asserts the engine's own attributes on both axes and that no `aria-value*`
  but `aria-valuetext` is written. `aria-valuetext` is the exception because no native
  attribute carries the human answer.
- **`aria-valuetext` lives in `src/announce.ts`,** DOM-free and under the same 100% coverage
  gate as the axis: it is a pure function of the axis and the resolution, and a string is
  exactly the kind of thing that is cheap to assert and expensive to eyeball. The numeric
  axis announces the *engine's* number, so the announcement and the thumb can never describe
  different values.
- **The strings are English and not configurable.** Spec §7 fixes "Astonished, 3 of 6" and
  spec §4.3 lists no message prop. An i18n seam is a v1.x addition, not a rename.
- **A disabled stop announces itself as unavailable** — "B, unavailable, 2 of 3" — which is
  the non-visual half of spec §7's rule that colour never carries meaning alone. It can only
  be heard where the value is on a disabled stop, because that is the only way a reader can
  be on one: keyboard, drag and click all skip them.
- **The focus colour default is the colour scheme's extreme** (`#171717` light, `#fafafa`
  dark), not an accent. The ring is drawn over the consumer's own ramp, and only the extreme
  clears every colour of the default ramp at 3:1 — measured in the browser, against the
  surface, the track and all six mood colours, for the default tokens and for the magenta
  recipe. In dark no single colour can clear both a near-black surface and a light ramp, so
  the ring paints its own inner edge in the surface colour with a `box-shadow`: there is then
  always a known, measured colour beside it wherever it crosses the track.
- **`axe-core` runs the WCAG 2.2 A/AA tags only**, not the best-practice rules, because AA is
  the requirement. A negative check mounts a Ranger nobody named and asserts axe *does* report
  `label`, so the five clean runs mean something.
- **The accessible-name warning is checked on mount, not in a `watchEffect`.** A wrapping
  `<label>` is a DOM question the props cannot answer, and asking it during render would be
  asking it on the server. Like every diagnostic it is development-only and said once.
- **`prefers-reduced-motion: reduce` now stops every transition in the component**, asserted
  over every element rather than over the thumb alone — the original hardcoded
  `transition: all 400ms` and offered no way to ask it to stop.

### Known limits, left as they are

- **`aria-valuetext` cannot be translated.** See above.
- **A numeric tick's `disabled` is neither skipped nor announced.** Spec §5.2 gives disabled
  stops meaning on an ordinal axis only, and the axis core never honoured it on a numeric one;
  announcing what the keyboard does not respect would be worse than silence.
- **A ring drawn over an arbitrary consumer ramp cannot be guaranteed at 3:1** by any single
  colour. The inner edge in the surface colour is what holds; a consumer whose ramp defeats
  the default sets `--ranger-focus-color`, which is exactly what the token is for.
- **Visual regression snapshots stay out of scope**, as the ticket says.

### After code review

- **The unset key rule is now observed rather than predicted.** The old rule intercepted all
  eight value keys while unset and committed the parked stop, so `End` chose the *first*
  stop — and on a numeric axis `ArrowRight` committed the minimum instead of stepping off it,
  which is worse and had no justification at all. `onKeyDown` now takes no key: it watches
  the press, and only if the whole press produced no `input` does the parked stop become the
  answer. Predicting which way a key moves an engine is what ADR-0001 says not to do, and
  watching is how you avoid it. Three browser tests cover it: the key that moves nothing, the
  key that moves (`End` reaches the last stop from unset), and the numeric axis stepping.
- **`commitAt` now serves both interactions the engine never sees.** The review found
  `onKeyDown`'s tail duplicated `jumpTo`'s verbatim.
- **The DEV guard is gone from `onMounted`.** It duplicated `warn`'s, and `warn` is the one
  part that is supposed to know about production builds; the check now produces a diagnostic
  and lets `warn` decide whether anyone hears it.
- **The `aria-valuemin`/`max`/`now` test says what it does and does not prove.** It pins our
  half — the right three numbers on both axes, and nothing overwriting the browser's mapping.
  A CDP read of the real accessibility node was tried and abandoned: the test page is an
  iframe, and `Accessibility.getPartialAXTree` cannot be handed a node inside it without more
  protocol plumbing than the claim is worth. `axe-core` already reads the real tree.
- **Test helpers moved to `tests/browser/harness.ts`** — `sentinel`, `emulate`,
  `blockWithLabel`, `flush` — following `mouse.ts`'s precedent. The mount lifecycles stay per
  file: issue 09 owns the interaction matrix and the harness it wants.

### Still open after review, and needing a decision

- **Spec §7's "disabled stops are conveyed non-visually" is only partly met.** A reader hears
  "unavailable" only when the value already sits on a disabled stop, and every interaction
  path skips those — so the state is inferable (the position count jumps from "1 of 3" to
  "3 of 3") but never announced. Announcing it properly wants `aria-describedby` on the
  engine pointing at a visually hidden list, which needs a generated `id`; issue 03's suite
  asserts a Ranger renders no `id` at all. Vue 3.5's `useId()` is SSR-safe and would do it,
  but overturning that contract is the maintainer's call, not this ticket's.
