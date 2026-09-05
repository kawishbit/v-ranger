<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods } from '../data'
import source from './RtlExample.vue?raw'

const rtl = ref('wow')
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard dir="rtl" theme="dark" background="#1e1b4b">
    <h2>The same, right to left</h2>
    <Ranger v-model="rtl" :stops="moods" aria-label="RTL" />
  </ExampleCard>
</template>
