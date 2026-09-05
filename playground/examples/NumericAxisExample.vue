<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { useLastCommit } from '../useLastCommit'
import source from './NumericAxisExample.vue?raw'

const score = ref<number | null>(50)
const { lastCommit, record } = useLastCommit<number | null>()
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="light" background="#dbeafe">
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
    <CodeBlock :code="lastCommit" lang="json" />
  </ExampleCard>
</template>
