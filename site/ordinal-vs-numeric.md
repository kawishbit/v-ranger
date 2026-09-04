<script setup lang="ts">
import { ref } from 'vue'

const mood = ref<'angry' | 'meh' | 'wow' | null>(null)
const moods = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'meh' as const, label: 'Meh', icon: '😑' },
  { value: 'wow' as const, label: 'Wow', icon: '😲' },
]

const score = ref<number | null>(null)
</script>

# Ordinal vs numeric

A Ranger is one component with two personalities, chosen entirely from which props you
pass — there is no `type` or `mode` prop to get wrong.

## Ordinal: a fixed set of named values

Pass `stops` and nothing else, and `v-model` carries whichever stop's own `value` is
selected — a string, an object, whatever you gave that stop. Stops are evenly spaced; a
lone stop sits at the start.

<div class="ranger-demo">
  <Ranger v-model="mood" :stops="moods" aria-label="Mood" />
  <p class="ranger-demo__value">typeof v-model: {{ typeof mood }} — value: {{ mood ?? 'null' }}</p>
</div>

<<< ./snippets/ordinal-example.vue

## Numeric: a continuous range

Pass `min` and `max` (presence of either is what selects this axis), and `v-model`
carries a plain number, clamped and snapped to `step`. `stops` becomes optional
decoration — ticks pinned at a coordinate (`at`) rather than named values.

<div class="ranger-demo">
  <Ranger
    v-model="score"
    :min="0"
    :max="100"
    :step="5"
    :stops="[{ at: 0, label: 'Cold', icon: '🥶' }, { at: 100, label: 'Hot', icon: '🥵' }]"
    aria-label="Score"
  />
  <p class="ranger-demo__value">typeof v-model: {{ typeof score }} — value: {{ score ?? 'null' }}</p>
</div>

<<< ./snippets/numeric-example.vue

## Why inferred, not a prop

An earlier design considered a `type="ordinal" | "numeric"` prop. It was dropped: the two
axes are already fully determined by which data you have — a list of named choices, or a
range — and a redundant prop is one more way for the two to disagree. `min`/`max` present
picks the numeric axis; otherwise `stops` present picks the ordinal one; neither present
renders an empty, disabled track with a development warning.

## Getting it wrong

- Numeric `stops` without `at` are dropped, with a warning — a coordinate-less tick has
  nowhere to sit on a continuous range.
- Ordinal stops with `at` set are a warning too: `at` is meaningless off a numeric axis.
- A `v-model` value that matches no ordinal stop renders unset, with a warning, rather
  than guessing.

None of this throws. A Ranger given contradictory props still renders — as close to what
you asked for as it can manage — and tells you about it in development only.
