<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from 'v-ranger'

const mood = ref<'angry' | 'meh' | 'wow' | null>(null)

const moods = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'meh' as const, label: 'Meh', icon: '😑' },
  { value: 'wow' as const, label: 'Wow', icon: '😲' },
]
</script>

<template>
  <main>
    <h1>v-ranger — Nuxt 3 SSR smoke test</h1>
    <Ranger v-model="mood" :stops="moods" aria-label="Mood" />
  </main>
</template>
