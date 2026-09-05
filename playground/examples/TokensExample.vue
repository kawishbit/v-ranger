<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods } from '../data'
import source from './TokensExample.vue?raw'

const retokened = ref('okay')
const darkIsland = ref('okay')
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="light" background="#f5f5f4">
    <h2>Tokens</h2>
    <p>One token on an ancestor, no rebuild and no <code>!important</code></p>
    <div style="--ranger-track-height: 1rem; --ranger-thumb-size: 2rem">
      <Ranger v-model="retokened" :stops="moods" aria-label="Retokened" />
    </div>

    <p>
      An explicit <code>data-theme="dark"</code> island, beating whatever the page's scheme says
    </p>
    <ExampleCard theme="dark" background="#0a0a0a">
      <Ranger v-model="darkIsland" :stops="moods" aria-label="Dark island" />
    </ExampleCard>
  </ExampleCard>
</template>
