<script setup lang="ts">
import { ref } from 'vue'

const presets = ['mood', 'sunset', 'ocean', 'heat', 'mono'] as const
const values = ref<Record<string, number | null>>({ mood: 50, sunset: 50, ocean: 50, heat: 50, mono: 50 })

const perStop = ref<'angry' | 'meh' | 'wow' | null>('wow')
const perStopStops = [
  { value: 'angry' as const, label: 'Angry', color: '#ffc300' },
  { value: 'meh' as const, label: 'Meh', color: '#ff6bd6' },
  { value: 'wow' as const, label: 'Wow', color: '#51eaea' },
]

const customValue = ref<number | null>(50)
</script>

# Gradients

`gradient` takes a preset name, a bare array of colours, or any CSS gradient string.

## Presets

<div v-for="preset in presets" :key="preset" class="ranger-demo">
  <p><code>gradient="{{ preset }}"</code></p>
  <Ranger v-model="values[preset]" :min="0" :max="100" :gradient="preset" :aria-label="preset" />
</div>

```vue
<Ranger v-model="score" :min="0" :max="100" gradient="sunset" />
```

`gradients` is exported so you can read the presets or extend them:

```ts
import { gradients } from 'v-ranger'
// gradients.mood -> ['#ffc300', '#ffb0fe', '#ff6bd6', '#ff9d76', '#51eaea', '#fb3569']
```

## A bare colour list

```vue
<Ranger v-model="score" :min="0" :max="100" :gradient="['#ff0000', '#0000ff']" />
```

## A raw CSS gradient string

If you need more control than a colour list gives — gradient stops at specific
percentages, a different function entirely — pass any valid CSS `<gradient>`:

```vue
<Ranger
  v-model="score"
  :min="0"
  :max="100"
  gradient="linear-gradient(to right, red 0%, yellow 30%, blue 100%)"
/>
```

<div class="ranger-demo">
  <Ranger v-model="customValue" :min="0" :max="100"
          gradient="linear-gradient(to right, red 0%, yellow 30%, blue 100%)"
          aria-label="Custom gradient" />
</div>

## Per-stop colour: vlider's exact look

Put a `color` on every stop and you get vlider's original per-stop ramp exactly, on an
ordinal axis:

<div class="ranger-demo">
  <Ranger v-model="perStop" :stops="perStopStops" aria-label="Mood" />
</div>

```vue
<Ranger
  v-model="mood"
  :stops="[
    { value: 'angry', label: 'Angry', color: '#ffc300' },
    { value: 'meh', label: 'Meh', color: '#ff6bd6' },
    { value: 'wow', label: 'Wow', color: '#51eaea' },
  ]"
/>
```

A stop's `color` overrides only its own slice of the ramp — the rest of the preset (or
whatever `gradient` resolved to) stays in place around it.

## The thumb's own colour

The thumb tints itself to whatever colour the ramp carries at its own position — the
selected stop's colour where there is one, or a `color-mix()` between two colours where
the value sits between numeric ticks — and transitions there rather than snapping. This
is the single biggest visual upgrade over vlider, where the thumb was `transparent` and,
built from a pseudo-element, could not have been animated even if it had a colour to
animate to.
