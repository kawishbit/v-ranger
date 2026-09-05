<script setup lang="ts">
import { Ranger } from '../../src/index'
</script>

<template>
  <section>
    <h2>Uncontrolled, and disabled stops</h2>
    <Ranger
      :stops="[
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ]"
      aria-label="Letters"
    />
  </section>
</template>
