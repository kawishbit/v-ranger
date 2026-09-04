# Spec: ranger v1

Status: ready-for-agent
Owner: kawishbit
Date: 2026-09-04

A colourful, emotive range slider for Vue 3, published to npm as **`v-ranger`**. Successor
to [vlider](https://github.com/kawishbit/vlider) in idea and visual design only — the API is
a clean break.

Vocabulary in this document is defined in [`CONTEXT.md`](../../CONTEXT.md). Decisions with
rejected alternatives are recorded in [`docs/adr/`](../../docs/adr/):

- [ADR-0001](../../docs/adr/0001-hybrid-native-range-input.md) — hybrid native range input
- [ADR-0002](../../docs/adr/0002-inferred-ordinal-and-numeric-axes.md) — ordinal and numeric axes, inferred
- [ADR-0003](../../docs/adr/0003-value-based-v-model-and-unset-state.md) — value-based `v-model`, `null` means unset
- [ADR-0004](../../docs/adr/0004-css-custom-properties-over-sass.md) — CSS custom properties, no Sass

## 1. Goals

1. Reproduce the vlider look — gradient track, labels above, emoji icons below — **on a clean install, with no extra dependencies**. vlider's demo silently required an external emoji font; ours must not.
2. Be a genuinely good slider: WCAG 2.2 AA, real keyboard support, real screen-reader output, RTL, SSR-safe.
3. Be restyleable without a build step. One CSS custom property, not a Sass toolchain.
4. Be a plain numeric slider too, when asked.

## 2. Non-goals for v1

Deferred deliberately, each addable without breaking the API: vertical orientation, dual-thumb range selection, a value tooltip that follows the thumb, haptic feedback, animated/Lottie icons, shared gradients across multiple sliders, a Nuxt module (a docs recipe covers it).

## 3. Platform

| Concern         | Decision                                                            |
| --------------- | ------------------------------------------------------------------- |
| Vue             | `^3.4` only, as a peer dependency. Vue 2 reached EOL 2023-12-31.     |
| Browsers        | Baseline Widely Available (so `color-mix()` and native nesting are fair game) |
| Node (dev)      | 20+                                                                  |
| Package manager | npm                                                                  |
| Language        | TypeScript, `strict: true`, SFCs with `<script setup lang="ts">`      |
| Styling         | Plain CSS, logical properties throughout. No preprocessor anywhere.  |
| SSR             | Supported. No `window`/`document` access during setup or render.     |

## 4. Public API

### 4.1 Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from 'v-ranger'
import 'v-ranger/style.css'

const mood = ref<string | null>(null)
const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]
</script>

<template>
  <Ranger v-model="mood" :stops="moods" gradient="mood" />
</template>
```

Numeric axis:

```vue
<Ranger v-model="score" :min="0" :max="100" :step="5"
        :stops="[{ at: 0, label: 'Cold', icon: '🥶' }, { at: 100, label: 'Hot', icon: '🥵' }]" />
```

### 4.2 Types

```ts
interface Stop<V = unknown> {
  /** What v-model carries when this stop is selected. Ordinal axis only; must be unique. */
  value?: V
  /** Coordinate on a numeric axis. Numeric axis only. */
  at?: number
  label?: string
  /** Unicode string, or a Vue component. */
  icon?: string | Component
  /** Image URL, rendered as <img>. Wins over `icon` where a stop has both. */
  image?: string
  /** What the image says to a reader who cannot see it. Defaults to `label`. */
  alt?: string
  /** Overrides this stop's slice of the gradient. Any CSS colour. */
  color?: string
  disabled?: boolean
}

type Gradient = string | string[]   // preset name | CSS gradient string | list of colours

interface Resolved<V> {
  value: V | number | null
  stop: Stop<V> | null
  index: number       // -1 when unset or between numeric stops
  position: number    // 0..1
}
```

### 4.3 Props

| Prop            | Type                          | Default   | Notes                                                     |
| --------------- | ----------------------------- | --------- | --------------------------------------------------------- |
| `modelValue`    | `V \| number \| null`         | `null`    | `null` is unset (ADR-0003). Uncontrolled use starts unset. |
| `stops`         | `Stop[]`                      | `[]`      | Required for an ordinal axis; optional ticks on a numeric one |
| `min`           | `number`                      | —         | Presence selects the numeric axis (ADR-0002)               |
| `max`           | `number`                      | —         | "                                                          |
| `step`          | `number`                      | `1`       | Numeric axis only                                          |
| `gradient`      | `Gradient`                    | `'mood'`  | Preset name, colour array, or CSS gradient string          |
| `disabled`      | `boolean`                     | `false`   | Whole slider. Per-stop disabling lives on the stop         |
| `readonly`      | `boolean`                     | `false`   | Displays a value; focusable, not changeable                |
| `showLabels`    | `boolean`                     | `true`    |                                                            |
| `showIcons`     | `boolean`                     | `true`    |                                                            |
| `labelPosition` | `'above' \| 'below'`          | `'above'` | Logical block-start / block-end                            |
| `iconPosition`  | `'above' \| 'below'`          | `'below'` |                                                            |
| `size`          | `'sm' \| 'md' \| 'lg'`        | `'md'`    | Sets the geometry tokens                                   |
| `name`          | `string`                      | —         | Forwarded to the engine for form participation             |

`inheritAttrs: false`. `class` and `style` land on the root; every other attribute
(including `aria-label`, `aria-labelledby`, `required`, `form`) is forwarded to the
interaction engine.

### 4.4 Events

| Event                | Payload       | When                                                                     |
| -------------------- | ------------- | ------------------------------------------------------------------------ |
| `update:modelValue`  | `V \| number` | Live, on every engine `input` — including mid-drag. Mirrors native.      |
| `change`             | `Resolved<V>` | On commit (pointer release, keyboard settle, label click). Mirrors native `change`. |

Neither fires on mount, on prop change, or on any render (ADR-0003).

### 4.5 Slots

| Slot    | Scope                                          | Replaces                            |
| ------- | ---------------------------------------------- | ----------------------------------- |
| `stop`  | `{ stop, index, selected, disabled, position }` | The whole label + icon block for a stop |
| `label` | same                                            | Just the label text                 |
| `icon`  | same                                            | Just the icon/image                 |
| `thumb` | `{ position, stop, unset }`                     | The thumb's contents                |

`selected` means "this stop is the selected stop". There is no separate `active`: because
the engine emits continuously during a drag, the two would always agree.

### 4.6 Exports

```ts
import { Ranger, gradients, type Stop, type Gradient, type Resolved } from 'v-ranger'
import RangerPlugin from 'v-ranger'   // app.use(RangerPlugin) registers <Ranger> globally
```

`gradients` exposes the preset ramps so consumers can read or extend them.

## 5. Behaviour

### 5.1 Axis resolution (ADR-0002)

- `min`/`max` present → **numeric axis**. Stops are ticks positioned at `at`; stops without `at` are a dev warning and are dropped.
- Otherwise `stops` present → **ordinal axis**. Position = `index / (count - 1)`; a single stop sits at position 0.
- Neither → dev warning; render an empty, disabled track.

All of this is pure functions over props, no DOM: `valueToPosition`, `positionToValue`, `nearestStop`, `resolve`.

### 5.2 Value resolution

- Ordinal: `modelValue` matched against `stop.value` by `Object.is`. No match and not `null` → dev warning, render unset.
- Numeric: clamped to `[min, max]` and snapped to `step`.
- Disabled stops are skipped by keyboard and pointer: a drag that lands on one settles on the nearest enabled stop; if none exists in that direction, the value does not move.
- `readonly` renders normally, remains focusable, and refuses all value changes.

### 5.3 Click-to-jump

Labels and icons are clickable and jump the thumb to their stop, then return focus to the engine. They are **not** individually focusable (`tabindex="-1"`) — the engine already provides a complete keyboard path (ADR-0001). Disabled stops do not respond.

### 5.4 Colour

- `gradient` becomes a `linear-gradient` on the track, in the writing direction (flipped under RTL).
- A stop's `color` overrides its slice — an ordinal axis with a `color` on every stop reproduces vlider's per-stop ramp exactly.
- The thumb tints to the colour the ramp carries at its own position — the nearest stop's colour wherever there is one — via `color-mix()`, and transitions between stops. This is the largest visual upgrade over vlider, where the thumb was `transparent`.
- Presets: `mood` (the magenta scale from the original), `sunset`, `ocean`, `heat`, `mono`.

## 6. Tokens

Public API; renaming one is a breaking change (ADR-0004).

**Geometry** `--ranger-track-height` `--ranger-track-radius` `--ranger-thumb-size` `--ranger-thumb-ring-width` `--ranger-gap` `--ranger-font` `--ranger-label-size` `--ranger-label-weight` `--ranger-label-weight-selected` `--ranger-icon-size`

**Colour** `--ranger-surface` `--ranger-track-color` `--ranger-gradient` `--ranger-thumb-color` `--ranger-thumb-border-color` `--ranger-label-color` `--ranger-label-color-selected` `--ranger-focus-color`

**States** `--ranger-unset-track-color` `--ranger-unset-opacity` `--ranger-disabled-opacity` `--ranger-transition`

**Set by the component, read-only for consumers** `--ranger-position` (0–1) `--ranger-gradient-direction` (set by the stylesheet, flipped under RTL) `--ranger-stop-position` (0–1, per stop marker) `--ranger-stop-count` `--ranger-active-color`

Root data attributes for state-based styling: `data-axis`, `data-size`, `data-unset`, `data-disabled`, `data-readonly`, `data-dragging`.

## 7. Accessibility — hard requirement

WCAG 2.2 AA. Non-negotiable, and the reason for ADR-0001.

- The engine is a real `<input type="range">` with `min`, `max`, `step`, `value`.
- `aria-valuetext` reads the human answer: `"Astonished, 3 of 6"` on an ordinal axis, the label plus number on a numeric one, and an explicit "no selection" when unset.
- Keyboard: arrows step; Home/End jump to the extremes; PageUp/PageDown move by a larger increment on a numeric axis. All inherited from the engine, but verified by test.
- `:focus-visible` on the engine draws a visible ring on the thumb, meeting AA non-text contrast against the track and the surface.
- Colour is never the sole carrier of meaning: every stop has a label or an accessible name, and `aria-valuetext` never depends on colour.
- Touch targets for clickable labels and icons are at least 24×24 CSS px.
- `prefers-reduced-motion: reduce` disables all transitions. vlider hardcoded `transition: all 400ms`.
- Images get an `alt` defaulting to the stop's label; decorative-only presentation-layer nodes are `aria-hidden` with `pointer-events: none`.
- Disabled stops are conveyed non-visually, not by opacity alone.

## 8. Packaging

- Vite library mode. **ESM** primary, **UMD** for CDN/`<script>`. `vue` externalised.
- Types via `vue-tsc`, verified so consumers get prop, emit and slot inference.
- `exports`: `.` (ESM + UMD + types), `./style.css`, `./full` (imports the CSS for zero-config use).
- `sideEffects` set so the CSS is never tree-shaken away and the JS is.
- `files`: `dist/` + `README.md` + `LICENSE`. **No `src/**`** — vlider shipped source only because the SCSS had to be compiled downstream.
- MIT, `"type": "module"`.

## 9. Testing

- **Pure logic** (`valueToPosition`, `positionToValue`, `nearestStop`, `resolve`, clamping, stepping, disabled skipping, unset) — Vitest, no DOM. This is where the bugs live.
- **Component** — Vitest + `@vue/test-utils` in jsdom for props, emits, slots, rendered structure, dev warnings.
- **Interaction** — Vitest browser mode (real Chromium via Playwright) for drag, keyboard, focus, touch and click-to-jump. jsdom returns zeroes from `getBoundingClientRect()`, so drag tests there would be theatre.
- **SSR** — render to string, assert no DOM access and no hydration mismatch.
- Visual regression is deferred past 1.0.

## 10. Docs and demo

VitePress in `site/`, importing the library by relative path. Deployed on **Vercel** at a `kawishbit.com` subdomain (`ranger.kawishbit.com` unless changed). Nothing built is ever committed.

Must contain: install and quickstart; the ordinal/numeric distinction up front; live prop playground; full token reference; **recipes** including the magenta original look; the `stop` slot; icons and images; accessibility notes; SSR/Nuxt recipe; and a **vlider migration table** (`vliderData`→`stops`, `id`→removed, index→value, `theme`→tokens, `extras`→the stop itself, `bullet` slot→`stop` slot).

## 11. Release

`0.1.0` — the API is one grilling old with no external users to validate it; the first real consumer will find something, and a fast `2.0.0` is worse than a `0.x`.

Changesets for versioning and notes. GitHub Actions (GitHub only, no other forge) runs typecheck, lint, unit + browser tests and build on every PR. **The first `npm publish` is run by a human**, after `npm publish --dry-run` shows a clean tarball. Provenance via the release workflow afterwards.

## 12. Issues

| #                                             | Title                                | Status          |
| --------------------------------------------- | ------------------------------------ | --------------- |
| [01](./issues/01-repo-scaffolding.md)         | Repo scaffolding and build pipeline  | ready-for-agent |
| [02](./issues/02-axis-core.md)                | Axis core: DOM-free value logic      | ready-for-agent |
| [03](./issues/03-component-shell.md)          | Component shell: engine + presentation | resolved        |
| [04](./issues/04-gradient-system.md)          | Gradient system and thumb tinting    | resolved        |
| [05](./issues/05-labels-icons-slots.md)       | Labels, icons and the stop slot      | resolved        |
| [06](./issues/06-accessibility.md)            | Accessibility to WCAG 2.2 AA         | ready-for-agent |
| [07](./issues/07-states.md)                   | Disabled, readonly and unset states  | ready-for-agent |
| [08](./issues/08-tokens-and-sizes.md)         | Token surface and size scale         | resolved        |
| [09](./issues/09-interaction-tests.md)        | Browser-mode interaction tests       | ready-for-agent |
| [10](./issues/10-packaging.md)                | Packaging, entries and SSR check     | ready-for-agent |
| [11](./issues/11-docs-site.md)                | VitePress docs site                  | ready-for-agent |
| [12](./issues/12-release-engineering.md)      | CI, changesets and first release     | ready-for-human |
