<script setup lang="ts">
import { ref } from 'vue'

const restyled = ref<'angry' | 'wow' | null>('wow')
const stops = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'wow' as const, label: 'Wow', icon: '😲' },
]
</script>

# Tokens

Every visual value on a Ranger is a `--ranger-*` custom property, declared on the
component's own root as a `var(--ranger-x, default)` fallback — so setting one on any
ancestor overrides it, at any specificity, with no rebuild, no `!important`, and no
theme class (renaming one is a breaking change).

## Restyled from an ancestor, live

<div class="ranger-demo" style="--ranger-track-height: 1.5rem; --ranger-thumb-size: 2.5rem; --ranger-label-color: #ad1457; --ranger-label-color-selected: #ad1457;">
  <Ranger v-model="restyled" :stops="stops" aria-label="Mood" />
</div>

```html
<div style="--ranger-track-height: 1.5rem; --ranger-thumb-size: 2.5rem;">
  <Ranger v-model="mood" :stops="stops" />
</div>
```

Nothing about the component changed — the div around it just set two tokens.

## Geometry

| Token                            | Default (`md`) |
| -------------------------------- | -------------- |
| `--ranger-track-height`          | `0.5rem`       |
| `--ranger-track-radius`          | `999px`        |
| `--ranger-thumb-size`            | `1.25rem`      |
| `--ranger-thumb-ring-width`      | `2px`          |
| `--ranger-gap`                   | `0.5rem`       |
| `--ranger-font`                  | `inherit`      |
| `--ranger-label-size`            | `0.8125rem`    |
| `--ranger-label-weight`          | `400`          |
| `--ranger-label-weight-selected` | `600`          |
| `--ranger-icon-size`             | `1.25rem`      |

## Colour

The dark value applies under `prefers-color-scheme: dark` — or under an explicit
`[data-theme="dark"]` ancestor, which beats the media query in either direction.

| Token                           | Light           | Dark      |
| ------------------------------- | --------------- | --------- |
| `--ranger-surface`              | `#ffffff`       | `#0a0a0a` |
| `--ranger-track-color`          | `#e5e5e5`       | `#262626` |
| `--ranger-gradient`             | the `mood` ramp | same      |
| `--ranger-thumb-color`          | `#525252`       | `#a3a3a3` |
| `--ranger-thumb-border-color`   | `#ffffff`       | `#0a0a0a` |
| `--ranger-label-color`          | `#525252`       | `#a3a3a3` |
| `--ranger-label-color-selected` | `#171717`       | `#fafafa` |
| `--ranger-focus-color`          | `#171717`       | `#fafafa` |

## States

| Token                        | Default                           |
| ---------------------------- | --------------------------------- |
| `--ranger-unset-track-color` | the track colour above, flattened |
| `--ranger-unset-opacity`     | `0.55`                            |
| `--ranger-disabled-opacity`  | `0.45`                            |
| `--ranger-transition`        | `160ms ease`                      |

## Set by the component — read-only for consumers

| Token                         | What it carries                          |
| ----------------------------- | ---------------------------------------- |
| `--ranger-position`           | The current value, `0`–`1`               |
| `--ranger-gradient-direction` | The writing direction; flipped under RTL |
| `--ranger-stop-position`      | Per stop marker, `0`–`1`                 |
| `--ranger-stop-count`         | Number of stops, for slice-width maths   |
| `--ranger-active-color`       | The colour the thumb is tinting toward   |

## Root data attributes

For state-based styling from outside, rather than a token: `data-axis` (`ordinal` /
`numeric`), `data-size`, `data-unset`, `data-disabled`, `data-readonly`, `data-dragging`.

## Size

`size` (`sm` / `md` / `lg`) is a shortcut that sets the geometry tokens above to three
preset scales — it moves geometry only, never colour, and a token you set yourself
always wins over it. Ignore `size` entirely and set the tokens directly if the three
presets don't fit.
