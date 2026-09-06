<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { highlighter, THEME } from './highlighter'

const props = withDefaults(defineProps<{ code: string; lang?: 'vue' | 'json' }>(), {
  lang: 'vue',
})

const html = ref('')

watchEffect(async () => {
  // Read before the `await`: `watchEffect` only tracks reactive reads made
  // synchronously, before the first await, so `props.code` has to be
  // captured here or a later change to it (e.g. `lastCommit` updating after
  // a drag commits) would never re-trigger this effect.
  const code = props.code.trim()
  const lang = props.lang

  const shiki = await highlighter()
  html.value = shiki.codeToHtml(code, { lang, theme: THEME })
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
