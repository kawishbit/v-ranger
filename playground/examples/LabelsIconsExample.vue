<script setup lang="ts">
import { Ranger } from '../../src/index'
import ExampleCard from '../ExampleCard.vue'
import { moods, verbose } from '../data'
</script>

<template>
  <ExampleCard theme="dark" background="#0f172a">
    <h2>Labels and icons, where the consumer wants them</h2>
    <p><code>label-position="below"</code>, <code>icon-position="above"</code></p>
    <Ranger :stops="moods" label-position="below" icon-position="above" aria-label="Swapped" />

    <p><code>:show-icons="false"</code></p>
    <Ranger :stops="moods" :show-icons="false" aria-label="Labels only" />

    <p><code>:show-labels="false"</code></p>
    <Ranger :stops="moods" :show-labels="false" aria-label="Icons only" />

    <p>Long labels wrap into their own slice rather than into a neighbour</p>
    <Ranger :stops="verbose" aria-label="Long labels" />
  </ExampleCard>
</template>
