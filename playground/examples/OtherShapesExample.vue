<script setup lang="ts">
import { Ranger } from '../../src/index'
import { moods, vliderStops } from '../data'
</script>

<template>
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
</template>
