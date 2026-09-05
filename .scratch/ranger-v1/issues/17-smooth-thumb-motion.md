# 17 — Smooth the thumb's motion for keyboard, click, and programmatic moves

Status: resolved
Blocked by: None (can start immediately)
Spec: [../spec.md](../spec.md) §7

## Goal

Moving the thumb any way other than a live pointer drag — an arrow key, Home/End,
PageUp/PageDown, clicking a label to jump to its stop, or a programmatic `v-model`
change from the consumer — snaps the thumb to its new position instantly. A live drag
already feels right, because it's directly coupled to the pointer; every other path
should glide there instead of teleporting.

## Scope

- Give `--ranger-position` a real, animatable transition (custom properties don't
  interpolate under a plain `var()` swap; this likely needs `@property --ranger-position`
  registering it as a `<number>`, or an equivalent way of making the browser tween it)
  and apply it to `.ranger__thumb`'s `inset-inline-start` (and `.ranger__fill`'s
  `inline-size`, which tracks the same value) alongside the existing background-colour
  transition.
- The transition must not apply during a live pointer or touch drag (`data-dragging`) —
  a drag has to track the pointer 1:1 with no added latency, so the new transition is
  scoped to the non-drag paths only (keyboard, click-to-jump, and an external `v-model`
  write).
- Reuse the existing `--ranger-transition` token for duration/easing rather than
  introducing a second one, so a consumer who already retuned it gets the same feel on
  both.
- `prefers-reduced-motion: reduce` already disables every transition in the stylesheet
  (spec §7) — confirm the new one falls under that same blanket rule rather than needing
  its own opt-out.

## Acceptance criteria

- Pressing an arrow key, Home/End, or PageUp/PageDown animates the thumb (and fill) to
  its new position rather than jumping.
- Clicking a label or icon to jump to its stop animates the same way.
- Changing `v-model` from outside the component animates the same way.
- A live pointer or touch drag shows no added lag — the thumb tracks the pointer exactly
  as it does today, transition or not.
- With `prefers-reduced-motion: reduce` set, every one of the above jumps instantly, with
  no animation.

## Out of scope

Changing the drag interaction itself, or the existing background-colour transition's
timing — only the position/fill motion is new here.

## Comments

**Resolved.** `@property --ranger-position { syntax: '<number>'; inherits: true;
initial-value: 0; }` registers the token as a real `<number>` in `src/ranger.css`, which
is what lets a browser tween it frame by frame rather than jumping between two committed
values — confirmed empirically in real Chromium before committing to the approach (an
unregistered custom property's inherited change did not, on its own, produce a
`CSSTransition`; a registered one does). `.ranger__thumb` gained `inset-inline-start` next
to its existing `background-color` transition, and `.ranger__fill` gained one for
`inline-size`, both riding `--_transition` (the `--ranger-transition` token), so a consumer
who has already retuned it gets the same feel on both.

**Scoped off `data-dragging`, not off the drag interaction itself**: `.ranger[data-dragging]
.ranger__thumb` drops back to only the `background-color` transition, and
`.ranger__fill` to `none` — the pointer/touch path was never touched, and neither was
its existing colour transition.

**`prefers-reduced-motion: reduce` needed no new rule.** The blanket `.ranger, .ranger *
{ transition: none }` at the end of the file already wins by source order at equal
specificity over every transition declared above it, new ones included — verified in a
real browser rather than assumed.

New `tests/browser/motion.test.ts` covers all of it, sampled over real wall-clock time
against the `--_transition` default (`160ms`) rather than through
`Element.getAnimations()` — that API proved racy in practice, since whether a transition
has started (or already finished) by the time a rendered frame is inspected depends on
exactly how many `requestAnimationFrame` ticks have elapsed, which varies run to run. A
`setTimeout`-based midpoint/settled sample was stable across repeated runs and is what the
suite uses instead: a keyboard move, a click-to-jump, and an external `v-model` write each
land at a *different* x partway through than at rest and than at the start (proving a
glide, not a snap); a live pointer drag and a `prefers-reduced-motion` keyboard move both
land at the *same* x immediately and after the transition duration has elapsed (proving no
lag either way).

Two pre-existing browser tests in `tests/browser/ranger.test.ts` asserted the thumb's pixel
position immediately after an external `setProps` write, which is exactly the case this
ticket makes animate — both now wait past `--_transition` before reading the settled
position, which is what they were actually trying to assert.

**A pre-existing flake, unrelated to this work**: `tests/browser/interaction.test.ts`'s
"touch drags the value the same way a pointer drag does, on the ordinal axis" test fails
intermittently in this sandbox's Chromium/CDP setup regardless of any change in this
session — reproduced on the pristine pre-session file, in isolation it passes. Left as is;
flagged rather than touched, since diagnosing a CDP touch-dispatch timing issue is outside
every one of tickets 14–17's scope.

### After code review

- **The drag-scoped override broke the reduced-motion blanket rule's own specificity
  trick.** `.ranger[data-dragging] .ranger__thumb` is three simple selectors (specificity
  3), while every other transition rule in the file — including the
  `@media (prefers-reduced-motion: reduce) { .ranger, .ranger * { transition: none } }`
  rule this ticket's own scope says to rely on — is specificity 1, winning only by *source
  order* (that rule's own comment says so). A higher-specificity rule wins regardless of
  order, so under reduced motion *during a drag*, the background-colour transition kept
  running instead of being killed — a real, confirmed defect (reproduced by temporarily
  reverting the fix and watching a new test fail with `0.16s` where `0s` was expected).
  Fixed by wrapping the ancestor condition in `:where(...)`, which always contributes zero
  specificity: `:where(.ranger[data-dragging]) .ranger__thumb` is specificity 1 again, so
  the existing order-based rule keeps working unmodified. A new test in
  `tests/browser/motion.test.ts` drags while emulating `prefers-reduced-motion: reduce` and
  asserts the thumb's `transitionDuration` is `0s`.
