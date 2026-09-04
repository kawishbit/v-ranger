<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from 'v-ranger'
import 'v-ranger/style.css'

// Not null: an unset Ranger deliberately paints no gradient (ADR-0003), and
// this app exists to prove the stylesheet applied.
const mood = ref<'angry' | 'meh' | 'wow' | 'ugh' | 'okay' | 'blush' | null>('wow')

const moods = [
  { value: 'angry' as const, label: 'Angry', icon: '😠' },
  { value: 'meh' as const, label: 'Expressionless', icon: '😑' },
  { value: 'wow' as const, label: 'Astonished', icon: '😲' },
  { value: 'ugh' as const, label: 'Confounded', icon: '😖' },
  { value: 'okay' as const, label: 'Okay?', icon: '🤨' },
  { value: 'blush' as const, label: 'Blush', icon: '😊' },
]
</script>

<template>
  <main>
    <h1>v-ranger — Vite smoke test</h1>
    <p>This app installs <code>v-ranger</code> from a packed tarball, not a workspace link.</p>
    <Ranger v-model="mood" :stops="moods" gradient="mood" aria-label="Mood" />
    <p data-testid="value">{{ mood ?? 'unset' }}</p>
  </main>
</template>
