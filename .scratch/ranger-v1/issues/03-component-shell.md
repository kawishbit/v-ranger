# 03 — Component shell: interaction engine + presentation layer

Status: ready-for-agent
Blocked by: 01, 02
Spec: [../spec.md](../spec.md) §4, §5 · [ADR-0001](../../../docs/adr/0001-hybrid-native-range-input.md)

## Goal

`<Ranger>` renders and works: a real range input driving a visually separate presentation layer, on both axes.

## Already landed in issue 01

`src/index.ts` (named `Ranger` export, default plugin with `install()`) and
`inheritAttrs: false` with attrs forwarded to the engine both exist already — issue 01
needed them to prove the build and the UMD global. Extend them; don't rewrite them. The
engine is still visible (`opacity: 0` is this ticket's job) and `src/ranger.css` is an
empty placeholder.

## Scope

- `src/Ranger.vue`, `<script setup lang="ts">`, `inheritAttrs: false` — `class`/`style` to the root, all other attrs to the engine.
- **Interaction engine**: one `<input type="range">` absolutely positioned over the track at `opacity: 0`, `min`/`max`/`step`/`value` derived from the axis. Never `display: none` or `visibility: hidden`. Carries `name` for form participation.
- **Presentation layer**: root → track → fill → thumb, plus a stop list. Positioned from `--ranger-position`; every decorative node is `aria-hidden` with `pointer-events: none`.
- `v-model` per ADR-0003: `update:modelValue` on engine `input` (live, mid-drag), `change` with a `Resolved` payload on commit. Never emit on mount or on prop change. Uncontrolled use starts unset and tracks internally.
- Root data attributes: `data-axis`, `data-size`, `data-unset`, `data-disabled`, `data-readonly`, `data-dragging`.
- `src/index.ts`: named `Ranger` export, `gradients`, types, and a default plugin export with `install()`.
- Baseline CSS in `src/ranger.css`, plain CSS, **logical properties only** — no `left`/`right`/`margin-left` anywhere (ADR-0004).

## Acceptance criteria

- Both axes render and update; the thumb's visual position matches `valueToPosition` at every step.
- Dragging the engine moves the visible thumb; the engine's `value` is the only source of truth and the two never disagree.
- No `document`/`window` access in setup or render; `renderToString` works.
- Nothing is written to `document.head`, and no `id` prop exists. Two Rangers on one page with identical props do not interfere (the vlider bug in ADR-0001).
- `aria-label` passed to `<Ranger>` lands on the engine, not the root.
- `grep -nE '(^|[^-])\b(left|right):' src/*.css` returns nothing.

## Out of scope

Gradients (04), labels/icons (05), ARIA text and keyboard verification (06), state styling (07).
