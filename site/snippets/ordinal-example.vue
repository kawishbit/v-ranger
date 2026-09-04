<script setup lang="ts">
import { ref } from 'vue'
const mood = ref<'angry' | 'meh' | 'wow' | null>(null)
const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Meh', icon: '😑' },
  { value: 'wow', label: 'Wow', icon: '😲' },
]
</script>

<template>
  <Ranger v-model="mood" :stops="moods" />
</template>
