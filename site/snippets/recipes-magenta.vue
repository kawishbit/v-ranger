<script setup lang="ts">
const moods = [
  { value: 'angry', label: 'Angry', icon: '😠', color: '#ffc300' },
  { value: 'meh', label: 'Expressionless', icon: '😑', color: '#ffb0fe' },
  { value: 'wow', label: 'Astonished', icon: '😲', color: '#ff6bd6' },
  { value: 'ugh', label: 'Confounded', icon: '😖', color: '#ff9d76' },
  { value: 'okay', label: 'Okay?', icon: '🤨', color: '#51eaea' },
  { value: 'blush', label: 'Blush', icon: '😊', color: '#fb3569' },
]
</script>

<template>
  <Ranger v-model="mood" :stops="moods" />
</template>
