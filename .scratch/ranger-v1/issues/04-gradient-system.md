# 04 — Gradient system and thumb tinting

Status: ready-for-agent
Blocked by: 03
Spec: [../spec.md](../spec.md) §5.4 · [ADR-0004](../../../docs/adr/0004-css-custom-properties-over-sass.md)

## Goal

The component is colourful out of the box, and recolouring it is one prop or one custom property.

## Scope

- `gradient` prop accepting three shapes: a **preset name**, an **array of colours**, or a **raw CSS gradient string**. Resolved to `--ranger-gradient` on the root — no runtime stylesheet, no `document.head` (ADR-0001).
- Presets in `src/gradients.ts`, exported as `gradients`: `mood` (the magenta ramp from the original vlider demo), `sunset`, `ocean`, `heat`, `mono`.
- Per-stop `color` overrides that stop's slice of the ramp, so an ordinal axis with a colour on every stop reproduces vlider's exact ramp.
- Gradient direction follows the writing direction and flips under RTL.
- `--ranger-active-color` resolves to the nearest stop's colour; the thumb tints from it via `color-mix()` and transitions between stops, honouring `prefers-reduced-motion`.

## Acceptance criteria

- The six-stop `mood` example reproduces the original screenshot's ramp with no per-stop colours supplied.
- All three `gradient` shapes render; an invalid preset name warns in dev and falls back to `mood`.
- `dir="rtl"` on an ancestor reverses the ramp and the fill direction.
- The thumb's colour changes as the value moves and is a smooth transition, except under `prefers-reduced-motion: reduce`.
- No `<style>` element is created at runtime by any code path.

## Out of scope

The full token surface and size scale (08); documenting recipes (11).
