<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods, verbose } from '../data'
import source from './LabelsIconsExample.vue?raw'

const swapped = ref('wow')
const labelsOnly = ref('wow')
const iconsOnly = ref('wow')
const longLabels = ref('b')
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="dark" background="#0f172a">
    <h2>Labels and icons, where the consumer wants them</h2>
    <p><code>label-position="below"</code>, <code>icon-position="above"</code></p>
    <Ranger
      v-model="swapped"
      :stops="moods"
      label-position="below"
      icon-position="above"
      aria-label="Swapped"
    />

    <p><code>:show-icons="false"</code></p>
    <Ranger v-model="labelsOnly" :stops="moods" :show-icons="false" aria-label="Labels only" />

    <p><code>:show-labels="false"</code></p>
    <Ranger v-model="iconsOnly" :stops="moods" :show-labels="false" aria-label="Icons only" />

    <p>Long labels wrap into their own slice rather than into a neighbour</p>
    <div class="label-overhang-guard">
      <Ranger v-model="longLabels" :stops="verbose" aria-label="Long labels" />
    </div>
  </ExampleCard>
</template>
