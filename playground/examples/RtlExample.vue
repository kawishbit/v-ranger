<script setup lang="ts">
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods } from '../data'
import source from './RtlExample.vue?raw'
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard dir="rtl" theme="dark" background="#1e1b4b">
    <h2>The same, right to left</h2>
    <Ranger :stops="moods" aria-label="RTL" />
  </ExampleCard>
</template>
