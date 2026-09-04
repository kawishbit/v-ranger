<script setup lang="ts">
import { ref } from 'vue'
import { gradients, Ranger } from '../src/index'

const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]

const presets = Object.keys(gradients)

/** What vlider's demo shipped, spelled the way a consumer would spell it now. */
const vliderStops = moods.map((stop, index) => ({ ...stop, color: gradients.mood[index] }))

const mood = ref<string | null>(null)
const score = ref<number | null>(null)

// Taken structurally rather than as `Resolved<V>`, so one handler serves both axes.
const lastCommit = ref('nothing committed yet')

/** Long enough that a slice cannot hold them on one line. */
const verbose = [
  { value: 'a', label: 'Extraordinarily disappointed', icon: '😠' },
  { value: 'b', label: 'Fine', icon: '😑' },
  { value: 'c', label: 'Absolutely delighted beyond measure', icon: '😊' },
]

function record(resolved: { value: unknown; index: number; position: number }) {
  lastCommit.value = JSON.stringify(resolved, null, 2)
}
</script>

<template>
  <main>
    <h1>ranger — dev playground</h1>

    <section>
      <h2>Ordinal axis</h2>
      <Ranger v-model="mood" :stops="moods" aria-label="Mood" @change="record($event)" />
      <p>
        <code>{{ mood ?? 'unset' }}</code>
      </p>
    </section>

    <section>
      <h2>Numeric axis</h2>
      <Ranger
        v-model="score"
        :min="0"
        :max="100"
        :step="5"
        :stops="[{ at: 0 }, { at: 50 }, { at: 100 }]"
        aria-label="Score"
        @change="record($event)"
      />
      <p>
        <code>{{ score ?? 'unset' }}</code>
      </p>
    </section>

    <section>
      <h2>Uncontrolled, and disabled stops</h2>
      <Ranger
        :stops="[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
          { value: 'c', label: 'C' },
        ]"
        aria-label="Letters"
      />
    </section>

    <section>
      <h2>Labels and icons, where the consumer wants them</h2>
      <p><code>label-position="below"</code>, <code>icon-position="above"</code></p>
      <Ranger :stops="moods" label-position="below" icon-position="above" aria-label="Swapped" />

      <p><code>:show-icons="false"</code></p>
      <Ranger :stops="moods" :show-icons="false" aria-label="Labels only" />

      <p><code>:show-labels="false"</code></p>
      <Ranger :stops="moods" :show-labels="false" aria-label="Icons only" />

      <p>Long labels wrap into their own slice rather than into a neighbour</p>
      <Ranger :stops="verbose" aria-label="Long labels" />
    </section>

    <section>
      <h2>Slots</h2>
      <p><code>#label</code> and <code>#icon</code> replace only their own part</p>
      <Ranger :stops="moods" aria-label="Label and icon slots">
        <template #label="{ stop, selected }">
          <span :style="{ textDecoration: selected ? 'underline' : 'none' }">
            {{ String(stop.label).toLowerCase() }}
          </span>
        </template>
        <template #icon="{ index }">
          <span>{{ index + 1 }}/6</span>
        </template>
      </Ranger>

      <p><code>#stop</code> replaces the whole block, and <code>#thumb</code> fills the thumb</p>
      <Ranger :stops="moods" aria-label="Stop and thumb slots">
        <template #stop="{ stop, selected, disabled }">
          <span :style="{ opacity: disabled ? 0.4 : 1, fontWeight: selected ? 700 : 400 }">
            {{ stop.icon }} {{ stop.label }}
          </span>
        </template>
        <template #thumb="{ unset }">
          <span style="font-size: 0.5rem">{{ unset ? '?' : '' }}</span>
        </template>
      </Ranger>
    </section>

    <section>
      <h2>Gradient presets</h2>
      <div v-for="name in presets" :key="name">
        <p>
          <code>{{ name }}</code>
        </p>
        <Ranger :stops="moods" :gradient="name" :aria-label="name" />
      </div>
    </section>

    <section>
      <h2>The other two shapes, and per-stop colour</h2>
      <p><code>:gradient="['#0ea5e9', '#22c55e']"</code></p>
      <Ranger :stops="moods" :gradient="['#0ea5e9', '#22c55e']" aria-label="A list of colours" />

      <p><code>gradient="linear-gradient(...)"</code> — any CSS gradient string</p>
      <Ranger
        :stops="moods"
        gradient="linear-gradient(var(--ranger-gradient-direction), #111827, #6b7280 40%, #f9fafb)"
        aria-label="A CSS gradient string"
      />

      <p><code>stop.color</code> on every stop — vlider's own ramp</p>
      <Ranger :stops="vliderStops" aria-label="Per-stop colour" />
    </section>

    <section dir="rtl">
      <h2>The same, right to left</h2>
      <Ranger :stops="moods" aria-label="RTL" />
    </section>

    <section>
      <h2>Last commit</h2>
      <pre>{{ lastCommit }}</pre>
    </section>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}

main {
  max-inline-size: 48rem;
  margin-inline: auto;
  padding-block: 3rem;
  padding-inline: 1.5rem;
}

section {
  margin-block-end: 2.5rem;
}

pre {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #f5f5f5;
  overflow: auto;
}
</style>
