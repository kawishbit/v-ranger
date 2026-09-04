---
title: Quickstart
---

<script setup lang="ts">
import { ref } from 'vue'

const mood = ref<'angry' | 'meh' | 'wow' | 'ugh' | 'okay' | 'blush' | null>(null)

const moods = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'meh' as const, label: 'Expressionless', icon: '😑' },
  { value: 'wow' as const, label: 'Astonished', icon: '😲' },
  { value: 'ugh' as const, label: 'Confounded', icon: '😖' },
  { value: 'okay' as const, label: 'Okay?', icon: '🤨' },
  { value: 'blush' as const, label: 'Blush', icon: '😊' },
]
</script>

# Quickstart

## Install

```sh
npm install v-ranger
```

Vue `^3.4` is a peer dependency — nothing else.

## The six-emotion example

This is a live `<Ranger>`, not a screenshot — drag it, or tab to it and use the arrow keys.

<div class="ranger-demo">
  <Ranger v-model="mood" :stops="moods" gradient="mood" aria-label="Mood" />
  <p class="ranger-demo__value">v-model: {{ mood ?? 'null (unset)' }}</p>
</div>

Paste this into a fresh Vue 3 app and it runs as-is:

<<< ./snippets/quickstart-example.vue

Prefer one import instead of two? `v-ranger/full` carries the stylesheet with it as a side
effect:

```ts
import { Ranger } from 'v-ranger/full'
```

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

## Events

| Event               | Payload       | When                                                                                |
| ------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `update:modelValue` | `V \| number` | Live, on every engine `input` — including mid-drag. Mirrors native.                 |
| `change`            | `Resolved<V>` | On commit (pointer release, keyboard settle, label click). Mirrors native `change`. |

Neither fires on mount, on a prop change, or on any render.

## Next

- [Ordinal vs numeric](./ordinal-vs-numeric) — the one decision the props table alone won't teach you.
- [Live playground](./playground) — every prop, with a Ranger next to it.
