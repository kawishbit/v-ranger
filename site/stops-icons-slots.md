<script setup lang="ts">
import { ref } from 'vue'

const mood = ref<'angry' | 'wow' | null>('wow')
const withImage = ref<'sun' | 'moon' | null>('sun')
const custom = ref<'angry' | 'wow' | null>('wow')

const moods = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'wow' as const, label: 'Astonished', icon: '😲' },
]

const times = [
  { value: 'sun' as const, label: 'Day', image: 'https://placehold.co/32x32/ffc300/ffffff?text=%E2%98%80', alt: 'Sun' },
  { value: 'moon' as const, label: 'Night', image: 'https://placehold.co/32x32/262626/ffffff?text=%E2%98%BD', alt: 'Moon' },
]
</script>

# Stops, icons and images

## A stop

```ts
interface Stop<V = unknown> {
  value?: V // What v-model carries. Ordinal axis only; must be unique.
  at?: number // Coordinate on a numeric axis. Numeric axis only.
  label?: string
  icon?: string | Component // Unicode text, or a Vue component. Never a font.
  image?: string // Rendered as <img>. Wins over `icon` where a stop has both.
  alt?: string // Defaults to `label`.
  color?: string // Overrides this stop's slice of the gradient.
  disabled?: boolean
}
```

## Icons are never a font

An icon is a plain unicode character, an `<img>`, or a Vue component — never a request
for a font nobody asked to install. vlider's own demo silently depended on one; a clean
`npm install v-ranger` never does.

<div class="ranger-demo">
  <Ranger v-model="mood" :stops="moods" aria-label="Mood" />
</div>

## Images

`image` renders as an `<img>` and takes precedence over `icon`. `alt` describes it to a
reader who cannot see it, and defaults to the stop's own `label` — which is right exactly
when the image _is_ the label, and wrong the moment it isn't, so set `alt` explicitly
when the two differ.

<div class="ranger-demo">
  <Ranger v-model="withImage" :stops="times" aria-label="Time of day" />
</div>

## Slots

| Slot    | Scope                                           | Replaces                                |
| ------- | ----------------------------------------------- | --------------------------------------- |
| `stop`  | `{ stop, index, selected, disabled, position }` | The whole label + icon block for a stop |
| `label` | same                                            | Just the label text                     |
| `icon`  | same                                            | Just the icon/image                     |
| `thumb` | `{ position, stop, unset }`                     | The thumb's contents                    |

A label and icon are clickable and jump the thumb to their stop — they are not
individually focusable (`tabindex="-1"`), because the interaction engine already
provides a complete keyboard path to every stop.

### Overriding just the label

<div class="ranger-demo">
  <Ranger v-model="custom" :stops="moods" aria-label="Mood">
    <template #label="{ stop, selected }">
      <strong :style="{ textDecoration: selected ? 'underline' : 'none' }">{{ stop.label }}</strong>
    </template>
  </Ranger>
</div>

```vue
<Ranger v-model="mood" :stops="moods">
  <template #label="{ stop, selected }">
    <strong :style="{ textDecoration: selected ? 'underline' : 'none' }">{{ stop.label }}</strong>
  </template>
</Ranger>
```

### Replacing the whole stop block

The `stop` slot takes over everything a stop would otherwise draw — `showLabels` and
`showIcons` stop mattering for stops it covers, since there is no default rendering left
to show or hide.

```vue
<Ranger v-model="mood" :stops="moods">
  <template #stop="{ stop, selected }">
    <span :class="{ selected }">{{ stop.icon }} {{ stop.label }}</span>
  </template>
</Ranger>
```

### The thumb slot

`#thumb` replaces the thumb's contents — useful for a value readout that travels with it.

```vue
<Ranger v-model="score" :min="0" :max="100">
  <template #thumb="{ position }">{{ Math.round(position * 100) }}</template>
</Ranger>
```
