<script setup lang="ts">
defineProps<{ code: string }>()
</script>

<template>
  <pre class="code-block"><code>{{ code.trim() }}</code></pre>
</template>

<style scoped>
.code-block {
  margin-block-end: 1rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #171717;
  color: #d4d4d4;
  font-size: 0.8125rem;
  line-height: 1.5;
  overflow: auto;
}
</style>
