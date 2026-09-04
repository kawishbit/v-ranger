# 09 — Browser-mode interaction tests

Status: resolved
Blocked by: 03, 05, 06, 07
Spec: [../spec.md](../spec.md) §9

## Goal

Test the half of the component jsdom cannot test honestly. jsdom has no layout, so `getBoundingClientRect()` returns zeroes and any drag assertion there is theatre.

## Scope

Vitest browser mode, real Chromium via Playwright:

- **Drag**: pointer down on the track, move, release — value tracks the pointer, `update:modelValue` fires continuously, `change` fires once on release, `data-dragging` is set only during the drag.
- **Click on the track** jumps to the nearest stop.
- **Click-to-jump** on a label and on an icon; focus returns to the engine.
- **Keyboard**: arrows, Home/End, PageUp/PageDown on both axes, including skipping a disabled stop.
- **Touch**: a touch drag behaves like a pointer drag.
- **Focus**: `:focus-visible` ring appears on keyboard focus and not on mouse click.
- **RTL**: `dir="rtl"` reverses direction for both drag and arrow keys.
- **Two instances** on one page do not interfere (the vlider bug in ADR-0001).
- **SSR**: `renderToString` output hydrates with no mismatch warning.

## Acceptance criteria

- The suite runs in CI headless and locally headed, from `npm run test:browser`.
- Every assertion above passes for the ordinal axis, the numeric axis, and the unset starting state.
- No test in the browser project relies on a fixed timeout to observe a value change.

## Out of scope

Visual regression snapshots — deferred past 1.0 as cross-platform flaky.

## Comments

### Implementation

`tests/browser/interaction.test.ts` carries the matrix; `tests/browser/mouse.ts` gained
granular `press`/`moveTo`/`release` (a drag observed mid-flight, not just its end state) and a
touch trio (`touchDown`/`touchMoveTo`/`touchUp`/`touchDrag`) over `Input.dispatchTouchEvent` —
no special browser-context config needed, CDP injects touch input directly.
`tests/browser/harness.ts` gained `blockWithIcon`, since a stop's label and icon render in two
separate `<button class="ranger__stop-block">`s (one per side), so `blockWithLabel` cannot find
an icon-only block. `vitest.config.ts` added `vue/server-renderer` to `optimizeDeps.include`,
for the same reason `axe-core` was already there: a dependency Vite discovers mid-run reloads
the page under a running test.

Two behaviours were checked empirically against real Chromium before being asserted, rather
than assumed: RTL reverses both arrow keys and drag direction on the numeric axis exactly as it
does on the ordinal one, and PageUp/PageDown on a short ordinal range (6 stops) turn out to
move by one step — the platform's own page-amount algorithm (`max(step, (max−min)/10)`)
degenerates to the step size once the range is this small, so the test asserts direction, not
magnitude.

### After code review

- **A mid-drag assertion now backs "tracks the pointer."** The review was right that
  asserting `updates.length > 1` plus the final value never checks that an *intermediate*
  `update:modelValue` matches an intermediate pointer position — that is consistent with a
  value that jumps around before settling correctly. Both drag tests now read the emitted
  value once mid-drag, before the pointer is anywhere near its final position.
- **The ordinal × numeric × unset cross-product is now exercised for every bullet**, not just
  the ones it was easiest to write first: `data-dragging`, click-on-track, click-to-jump, RTL
  and SSR each gained the missing axis or the missing starting state (unset click-to-jump and
  click-on-track; numeric and unset SSR hydration; numeric RTL arrows and drag; numeric and
  unset `data-dragging`; a numeric-axis tick label click-to-jump; a two-instance test that
  drags a numeric Ranger next to an ordinal one). The acceptance criterion says "every
  assertion above," and the first pass silently read that as "every assertion, at least
  once."
- **The three SSR tests now share one `hydrate()` helper** rather than repeating the
  console-spy dance, which both closes the coverage gap above without tripling the
  duplication and pre-empts the "duplicated code" smell the review would otherwise have
  raised on a third copy.
- **Two click-to-jump assertions now await a tick** after `userEvent.click`, matching
  `labels.test.ts`'s established idiom for the same interaction — harmless either way in this
  runtime, but there is no reason for this file to be the one exception.
- **A stray inconsistent JSDoc opening was reflowed** onto its own line.
- **Kept: the touch trio duplicates the mouse trio's down/move/up shape.** The review flagged
  this as a mild smell. The two are not the same code wearing a costume — `Input
  .dispatchMouseEvent` and `Input.dispatchTouchEvent` take different payload shapes
  (`button`/`buttons` vs. `touchPoints`) — and a shared "three-phase gesture" abstraction over
  two call sites this small would be the Speculative Generality the same baseline warns
  against. Left as the parallel, readable pair it is.
