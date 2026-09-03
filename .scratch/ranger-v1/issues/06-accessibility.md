# 06 — Accessibility to WCAG 2.2 AA

Status: ready-for-agent
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
