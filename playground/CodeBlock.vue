<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { highlighter, THEME } from './highlighter'

const props = withDefaults(defineProps<{ code: string; lang?: 'vue' | 'json' }>(), {
  lang: 'vue',
})

const html = ref('')

watchEffect(async () => {
  const shiki = await highlighter()
  html.value = shiki.codeToHtml(props.code.trim(), { lang: props.lang, theme: THEME })
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- Shiki's own markup, never consumer input -->
  <div class="code-block" v-html="html" />
</template>

<style scoped>
.code-block {
  margin-block-end: 1rem;
  border-radius: 0.5rem;
  overflow: auto;
}

.code-block :deep(pre) {
  margin: 0;
  padding: 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
