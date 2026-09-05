<script setup lang="ts">
defineProps<{
  theme: 'light' | 'dark'
  background: string
}>()
</script>

<template>
  <section
    class="example-card"
    :data-theme="theme"
    :style="{
      background,
      color: theme === 'dark' ? '#fafafa' : '#171717',
      '--ranger-surface': background,
    }"
  >
    <slot />
  </section>
</template>

<style scoped>
.example-card {
  padding: 1.5rem;
  border-radius: 0.75rem;
}
</style>
