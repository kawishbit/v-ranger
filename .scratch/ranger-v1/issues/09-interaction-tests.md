# 09 — Browser-mode interaction tests

Status: ready-for-agent
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
