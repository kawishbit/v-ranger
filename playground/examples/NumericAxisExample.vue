<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../../src/index'
import { useLastCommit } from '../useLastCommit'

const score = ref<number | null>(null)
const { lastCommit, record } = useLastCommit<number | null>()
</script>

<template>
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
    <pre>{{ lastCommit }}</pre>
  </section>
</template>
