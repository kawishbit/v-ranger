<script setup lang="ts">
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods } from '../data'
import source from './OtherShapesExample.vue?raw'
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="light" background="#fce7f3">
    <h2>The other two shapes, and per-stop colour</h2>
    <p><code>:gradient="['#0ea5e9', '#22c55e']"</code></p>
    <Ranger :stops="moods" :gradient="['#0ea5e9', '#22c55e']" aria-label="A list of colours" />

    <p><code>gradient="linear-gradient(...)"</code> — any CSS gradient string</p>
    <Ranger
      :stops="moods"
      gradient="linear-gradient(var(--ranger-gradient-direction), #111827, #6b7280 40%, #f9fafb)"
      aria-label="A CSS gradient string"
    />
  </ExampleCard>
</template>
