# v-ranger

A colourful, emotive Ranger for Vue 3. Reproduces the gradient-track, labelled,
emoji-iconed look of [vlider](https://github.com/kawishbit/vlider) — same idea, clean-break
API — and works as a plain numeric Ranger too.

- Real keyboard, pointer, touch and screen-reader support, from a native
  `<input type="range">` under the hood.
- WCAG 2.2 AA, RTL, SSR-safe.
- Restyleable from one CSS custom property. No Sass, no theme classes, no build step to
  change how it looks.
- Zero required dependencies. No emoji font, no icon font.

## Install

```sh
npm install v-ranger
```

Vue `^3.4` is a peer dependency.

## Quickstart

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

Prefer one import over two? `v-ranger/full` carries the stylesheet with it:

```ts
import { Ranger } from 'v-ranger/full'
```

A plain numeric Ranger needs no `stops` at all — pass `min`/`max` instead, which is what
selects the numeric axis:

```vue
<Ranger
  v-model="score"
  :min="0"
  :max="100"
  :step="5"
  :stops="[
    { at: 0, label: 'Cold', icon: '🥶' },
    { at: 100, label: 'Hot', icon: '🥵' },
  ]"
/>
```

## Ordinal vs numeric

`min`/`max` present selects the **numeric axis** — a continuous range, with `stops` as
optional decorative ticks pinned at `at`. Otherwise, `stops` alone selects the **ordinal
axis** — a fixed set of named values, evenly spaced, and `v-model` carries whichever
`stop.value` is selected. Passing neither renders an empty, disabled track with a
development warning.

## Props

| Prop            | Type                   | Default   | Notes                                                         |
| --------------- | ---------------------- | --------- | ------------------------------------------------------------- |
| `modelValue`    | `V \| number \| null`  | `null`    | `null` is unset. Uncontrolled use starts unset.               |
| `stops`         | `Stop[]`               | `[]`      | Required for an ordinal axis; optional ticks on a numeric one |
| `min`           | `number`               | —         | Presence selects the numeric axis                             |
| `max`           | `number`               | —         | "                                                             |
| `step`          | `number`               | `1`       | Numeric axis only                                             |
| `gradient`      | `Gradient`             | `'mood'`  | Preset name, colour array, or CSS gradient string             |
| `disabled`      | `boolean`              | `false`   | Whole Ranger. Per-stop disabling lives on the stop            |
| `readonly`      | `boolean`              | `false`   | Displays a value; focusable, not changeable                   |
| `showLabels`    | `boolean`              | `true`    |                                                               |
| `showIcons`     | `boolean`              | `true`    |                                                               |
| `labelPosition` | `'above' \| 'below'`   | `'above'` | Logical block-start / block-end                               |
| `iconPosition`  | `'above' \| 'below'`   | `'below'` |                                                               |
| `size`          | `'sm' \| 'md' \| 'lg'` | `'md'`    | Sets the geometry tokens                                      |
| `name`          | `string`               | —         | Forwarded to the interaction engine for form participation    |

`inheritAttrs: false` — `class`/`style` land on the root; every other attribute
(`aria-label`, `required`, `form`, …) is forwarded to the interaction engine.

## Events

| Event               | Payload       | When                                                                                |
| ------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `update:modelValue` | `V \| number` | Live, on every engine `input` — including mid-drag. Mirrors native.                 |
| `change`            | `Resolved<V>` | On commit (pointer release, keyboard settle, label click). Mirrors native `change`. |

Neither fires on mount, on a prop change, or on any render.

## Slots

| Slot    | Scope                                           | Replaces                                |
| ------- | ----------------------------------------------- | --------------------------------------- |
| `stop`  | `{ stop, index, selected, disabled, position }` | The whole label + icon block for a stop |
| `label` | same                                            | Just the label text                     |
| `icon`  | same                                            | Just the icon/image                     |
| `thumb` | `{ position, stop, unset }`                     | The thumb's contents                    |

## Gradients

`gradient` takes a preset name, a bare colour array, or any CSS gradient string:

| Preset   | Ramp                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| `mood`   | `#ffc300 #ffb0fe #ff6bd6 #ff9d76 #51eaea #fb3569` (the default; vlider's own ramp) |
| `sunset` | `#ffcf70 #ff9f5a #ff6f61 #c94b8c #5f2c82`                                          |
| `ocean`  | `#0b3d91 #1268b3 #2196c9 #4fc3d9 #a8e6ea`                                          |
| `heat`   | `#1b1464 #7b2cbf #e63946 #f77f00 #ffd60a`                                          |
| `mono`   | `#e5e7eb #9ca3af #4b5563 #111827`                                                  |

`gradients` is exported so you can read or extend them:

```ts
import { gradients } from 'v-ranger'
```

A stop's own `color` overrides its slice of the ramp — put a `color` on every stop and
you get vlider's exact per-stop look. The thumb tints to whatever colour the ramp carries
at its own position, and transitions between stops.

## Tokens

Every visual value is a `--ranger-*` custom property. Restyle from any ancestor — no
rebuild, no `!important`, no theme class.

**Geometry**

| Token                            | Default            |
| -------------------------------- | ------------------ |
| `--ranger-track-height`          | `0.5rem` (`md`)    |
| `--ranger-track-radius`          | `999px`            |
| `--ranger-thumb-size`            | `1.25rem` (`md`)   |
| `--ranger-thumb-ring-width`      | `2px`              |
| `--ranger-gap`                   | `0.5rem` (`md`)    |
| `--ranger-font`                  | `inherit`          |
| `--ranger-label-size`            | `0.8125rem` (`md`) |
| `--ranger-label-weight`          | `400`              |
| `--ranger-label-weight-selected` | `600`              |
| `--ranger-icon-size`             | `1.25rem` (`md`)   |

**Colour** (light / dark — the dark value applies under `prefers-color-scheme: dark` or
`[data-theme="dark"]`)

| Token                           | Light                                         | Dark      |
| ------------------------------- | --------------------------------------------- | --------- |
| `--ranger-surface`              | `#ffffff`                                     | `#0a0a0a` |
| `--ranger-track-color`          | `#e5e5e5`                                     | `#262626` |
| `--ranger-gradient`             | the `mood` ramp (read-only unless you set it) | same      |
| `--ranger-thumb-color`          | `#525252`                                     | `#a3a3a3` |
| `--ranger-thumb-border-color`   | `#ffffff`                                     | `#0a0a0a` |
| `--ranger-label-color`          | `#525252`                                     | `#a3a3a3` |
| `--ranger-label-color-selected` | `#171717`                                     | `#fafafa` |
| `--ranger-focus-color`          | `#171717`                                     | `#fafafa` |

**States**

| Token                        | Default                           |
| ---------------------------- | --------------------------------- |
| `--ranger-unset-track-color` | the track colour above, flattened |
| `--ranger-unset-opacity`     | `0.55`                            |
| `--ranger-disabled-opacity`  | `0.45`                            |
| `--ranger-transition`        | `160ms ease`                      |

**Set by the component, read-only for consumers**: `--ranger-position` (`0`–`1`),
`--ranger-gradient-direction` (flipped under RTL), `--ranger-stop-position` (per stop
marker), `--ranger-stop-count`, `--ranger-active-color`.

**Root data attributes**, for state-based styling: `data-axis`, `data-size`,
`data-unset`, `data-disabled`, `data-readonly`, `data-dragging`.

`size` (`sm`/`md`/`lg`) only ever sets the geometry tokens above — a token you set
yourself always wins over it.

## SSR / Nuxt 3

No `window`/`document` access happens during setup or render, so `renderToString` and
hydration are both safe out of the box. In Nuxt, register the stylesheet as global CSS
rather than importing it inside a component, so it is present on the very first
server-rendered response:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: ['v-ranger/style.css'],
})
```

## Accessibility

- The interaction engine is a real `<input type="range">`: full native keyboard support
  (arrows, Home/End, Page Up/Down), and a screen reader gets `role="slider"` for free.
- `aria-valuetext` carries the human answer — a stop's label, not just a number — and
  says when a stop is unavailable.
- Name the control yourself: `aria-label`, `aria-labelledby`, or a wrapping `<label>`. A
  Ranger nobody names warns about it in development.
- Every colour pairing (focus ring against the surface, the track, and the whole default
  ramp) clears WCAG's 3:1 non-text contrast at every size.
- A disabled stop is never marked by colour alone — its label is struck through too.
- `prefers-reduced-motion: reduce` turns off every transition, not just the thumb's.

## Migrating from vlider

| vlider                     | v-ranger                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `vliderData` prop          | `stops` prop                                                                                    |
| `id` prop                  | Removed — nothing to disambiguate; two Rangers on one page never interfered in the first place. |
| Selection by 1-based index | Selection by the stop's own `value`, through `v-model`                                          |
| `theme` prop               | `--ranger-*` tokens, set from any ancestor                                                      |
| Per-item `extras`          | Whatever else you put on the stop object itself                                                 |
| `#bullet` slot             | `#stop` slot (scope: `{ stop, index, selected, disabled, position }`)                           |

## Documentation site

The full docs — a live prop playground, per-page recipes, accessibility notes, and the
vlider migration guide — live in `site/` (VitePress) and deploy to
[ranger.kawishbit.com](https://ranger.kawishbit.com) from `vercel.json` at the repo root
on every push to `main`. **Connecting that Vercel project to this repo, and pointing
`ranger.kawishbit.com`'s DNS at it, is a one-time human step** — nothing in this repo
can do either. Locally:

```sh
cd site
npm install
npm run dev
```

## License

MIT
