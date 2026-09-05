# 16 — Make the disabled state fully inert to dragging

Status: resolved
Blocked by: None (can start immediately)
Spec: [../spec.md](../spec.md) §5.2 · issue 07

## Goal

A `disabled` Ranger (the whole-slider case: dimmed, `data-disabled` on the root, engine
`disabled`) can still be dragged between its two ends — continuously, skipping every
step in between, rather than the stepped snapping a drag produces when enabled. A native
`<input disabled>` should not respond to pointer input at all, so this is a real
regression against what disabled is supposed to guarantee, not the already-documented
`readonly` flicker (issue 07's known limits) — that one snaps back to the last committed
value after a drag; this one doesn't resist the drag to begin with.

## Scope

- Reproduce the drag against a `disabled` Ranger (mouse and touch) and find why the
  native `disabled` attribute on the engine isn't stopping it — candidates worth ruling
  out: the `disabled` binding not reaching the DOM in time relative to `pointerdown`,
  something on the decorative overlay intercepting the gesture instead of the native
  input refusing it, or attribute ordering with consumer-forwarded `$attrs`.
- Fix it so a disabled Ranger takes no pointer or keyboard input at all: no value change,
  no visible thumb movement, whether dragged fast or slow, mouse or touch.
- Re-check `readonly`'s already-known flicker (issue 07) isn't the same root cause wearing
  a different name; fix it too if the same change closes it, otherwise leave it exactly
  as documented and out of this ticket's scope.

## Acceptance criteria

- Dragging across a `disabled` Ranger, start to end, never changes its value and never
  moves the thumb, for both a mouse-style drag and a touch drag.
- A regression test lands in the browser-mode interaction suite (`tests/browser/`,
  alongside issue 09's matrix) that performs a real drag against a disabled Ranger and
  asserts nothing moved — jsdom has no layout, so this needs the same real-Chromium
  approach the rest of that suite uses.
- Keyboard and click-to-jump against a disabled Ranger are re-verified alongside the fix,
  even though they weren't reported broken, since they share the same `disabled` check.

## Out of scope

`readonly`'s documented flicker, unless the same fix happens to close it — that trade is
issue 07's and issue 09's to make, not this ticket's to force.

## Comments

**Investigated, no defect found — coverage was the actual gap.** Reproduced with a real
CDP mouse drag, a real CDP touch drag, and a slow drag with intermediate moves, all
start-to-end against a whole-`disabled` Ranger (initially disabled, and toggled to
`disabled` mid-drag): in every case the native `disabled` binding on the engine (`:disabled
="isDisabled"`, `src/Ranger.vue`) already stopped the browser from moving the slider at
all — no `input` fired, the engine's own value never changed, and `data-dragging` settled
back to unset on release. `src/` has no pixel-based drag path of its own to bypass it
either: every value change flows through the native input's `input`/`change` events (a
`grep` for `clientX`/`getBoundingClientRect` turns up nothing in `src/`), so there was
nothing for a decorative overlay or attribute-ordering race to intercept.

The real gap was the missing regression: `tests/browser/states.test.ts`'s existing
`disabled` suite only covered a *disabled stop* (dragging onto one, mid-scale), never the
*whole-Ranger* disabled case with a real drag. Added to `tests/browser/interaction.test.ts`
(issue 09's own matrix): a mouse-and-touch drag start-to-end, a slow drag with
intermediate moves, and a re-verification that click-to-jump (via `clickOn`, not
`userEvent.click`, for the same reason `states.test.ts` already uses it — the point is
whether a disabled target ever becomes "clickable") and focus-by-keyboard are still
refused. All pass.

`readonly`'s flicker (issue 07's known limit) is a different root cause — the engine
*does* move during a readonly drag, and is snapped back on the next tick — and is
unaffected by anything here, so it stays exactly as documented.
