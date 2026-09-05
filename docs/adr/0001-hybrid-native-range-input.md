# ADR-0001: A hybrid native range input, not a styled one and not a custom one

- **Status:** Accepted
- **Date:** 2026-09-04
- **Supersedes:** the predecessor's directly-styled `<input type="range">`

## Context

A Ranger must do two things that pull against each other.

It must feel like a native control: keyboard (arrows, Home/End, PageUp/PageDown), pointer drag with the platform's own tracking behaviour, touch, focus management, form participation, and correct screen-reader semantics. Reimplementing that faithfully is a large, subtle, easy-to-get-wrong amount of work.

It must also look nothing like a native control. The whole premise of the component is colour and expression: a gradient track, a thumb that tints itself to the selected stop and transitions between colours, labels above, icons below.

The predecessor styled the native input directly through vendor pseudo-elements (`::-webkit-slider-runnable-track`, `::-moz-range-thumb`, `::-ms-fill-lower`). That choice had consequences that shaped — and damaged — the rest of its design:

- The gradient could not be expressed per-instance in CSS, so the predecessor generated a `<style id="rangeStyle{id}">` element and appended it to `document.head` on mount.
- That, in turn, forced a required `id` prop. Two Rangers left at the default `id` would silently overwrite each other's stylesheet.
- The thumb had to be `background: transparent`, because a pseudo-element thumb cannot hold content and cannot easily be tinted per-value. The visible marker dots were actually `::after` pseudo-elements on the `<li>` labels — the thumb itself was invisible.
- Pseudo-element styling is not consistently animatable, so colour interpolation between stops was out of reach.

## Decision

Every Ranger renders a real `<input type="range">` positioned over the track area at `opacity: 0`. It is the **interaction engine**: it receives all pointer and keyboard input, holds focus, carries the ARIA attributes, and participates in forms.

Everything visible is the **presentation layer** — ordinary DOM elements (track, fill, thumb, labels, icons) positioned from CSS custom properties derived from the current position, e.g. `inset-inline-start: calc(var(--ranger-position) * 100%)`.

No vendor pseudo-element is styled for appearance. No stylesheet is generated at runtime. No `id` prop exists.

## Consequences

**Positive**

- Native keyboard, drag, touch, focus and form behaviour, for free and correct.
- The thumb is a normal element: it can be tinted with `color-mix()`, animated, given a glow, or filled by a slot.
- Per-instance gradients need no global state — a custom property on the root element does it. This removes the `<style>` injection, the `document.head` mutation, and the `id` prop in one move, and makes the component SSR-safe by construction.
- Multiple Rangers on a page cannot interfere with each other.

**Negative**

- An invisible element sits on top of the visuals, so `pointer-events` must be managed deliberately: the engine needs the pointer, hover affordances on the presentation layer need it too. Anything decorative gets `pointer-events: none`.
- The engine's hit area is a rectangle over the track. Click-to-jump on labels and icons — which sit outside that rectangle — must be wired by hand rather than inherited.
- The engine must be genuinely invisible but genuinely focusable: `opacity: 0`, never `display: none` or `visibility: hidden`, and the focus ring must be drawn by the presentation layer in response to `:focus-visible` on the engine.
- Two elements express one value, so they must never disagree. The engine's `value` is the single source of truth; the presentation layer is derived from it and never holds state of its own.

## Alternatives considered

**Style the native input directly (the predecessor's approach).** Rejected: it cannot deliver a content-bearing, colour-interpolating thumb, and its need for a generated stylesheet is what produced the `id` prop and the global-state bug.

**Fully custom `<div role="slider">`.** Rejected: total visual freedom, but we would own keyboard handling, pointer/touch/pen tracking, focus management, form participation and every ARIA detail — the largest and least differentiated part of the work, and the part most likely to be subtly wrong for assistive technology. It is also the only option that turns WCAG 2.2 AA from a checklist into a research project.

A future dual-thumb mode cannot use a single native input. If that ships, it will be a second engine implementation behind the same presentation layer — which this split makes possible, and which is a deliberate reason to keep the two layers separate.
