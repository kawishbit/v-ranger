<script setup lang="ts">
import { ref } from 'vue'
import { gradients, Ranger } from '../src/index'

const moods = [
  { value: 'angry', label: 'Angry' },
  { value: 'meh', label: 'Expressionless' },
  { value: 'wow', label: 'Astonished' },
  { value: 'ugh', label: 'Confounded' },
  { value: 'okay', label: 'Okay?' },
  { value: 'blush', label: 'Blush' },
]

const presets = Object.keys(gradients)

/** What vlider's demo shipped, spelled the way a consumer would spell it now. */
const vliderStops = moods.map((stop, index) => ({ ...stop, color: gradients.mood[index] }))

const mood = ref<string | null>(null)
const score = ref<number | null>(null)

// Labels and icons arrive with issue 05, so until then the committed payload is
// the only way to see what a stop resolved to. Taken structurally rather than as
// `Resolved<V>`, so one handler can serve both axes.
const lastCommit = ref('nothing committed yet')

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
