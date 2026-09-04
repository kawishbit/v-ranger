<script setup lang="ts">
import { ref } from 'vue'
const score = ref<number | null>(null)
</script>

<template>
  <Ranger
    v-model="score"
    :min="0"
    :max="100"
    :step="5"
    :stops="[
      { at: 0, label: 'Cold', icon: '🥶' },
      { at: 100, label: 'Hot', icon: '🥵' },
    ]"
  />
</template>
