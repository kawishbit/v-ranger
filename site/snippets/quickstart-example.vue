<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from 'v-ranger'
import 'v-ranger/style.css'

const mood = ref<string | null>(null)
const moods = [
  { value: 'angry', label: 'Angry', icon: '😠' },
  { value: 'meh', label: 'Expressionless', icon: '😑' },
  { value: 'wow', label: 'Astonished', icon: '😲' },
  { value: 'ugh', label: 'Confounded', icon: '😖' },
  { value: 'okay', label: 'Okay?', icon: '🤨' },
  { value: 'blush', label: 'Blush', icon: '😊' },
]
</script>

<template>
  <Ranger v-model="mood" :stops="moods" gradient="mood" />
</template>
