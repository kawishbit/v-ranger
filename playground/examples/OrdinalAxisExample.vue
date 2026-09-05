<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods } from '../data'
import { useLastCommit } from '../useLastCommit'
import source from './OrdinalAxisExample.vue?raw'

const mood = ref<string | null>(null)
const { lastCommit, record } = useLastCommit<string | number>()
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="light" background="#fef3c7">
    <h2>Ordinal axis</h2>
    <Ranger v-model="mood" :stops="moods" aria-label="Mood" @change="record($event)" />
    <p>
      <code>{{ mood ?? 'unset' }}</code>
    </p>
    <pre>{{ lastCommit }}</pre>
  </ExampleCard>
</template>
