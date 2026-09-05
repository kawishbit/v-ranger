<script setup lang="ts">
import { Ranger } from '../../src/index'
import ExampleCard from '../ExampleCard.vue'
</script>

<template>
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
