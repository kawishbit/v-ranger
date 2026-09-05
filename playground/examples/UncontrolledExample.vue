<script setup lang="ts">
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import source from './UncontrolledExample.vue?raw'
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="dark" background="#171717">
    <h2>Uncontrolled, and disabled stops</h2>
    <Ranger
      :stops="[
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ]"
      aria-label="Letters"
    />
  </ExampleCard>
</template>
