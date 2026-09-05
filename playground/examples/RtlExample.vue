<script setup lang="ts">
import { Ranger } from '../../src/index'
import ExampleCard from '../ExampleCard.vue'
import { moods } from '../data'
</script>

<template>
  <ExampleCard dir="rtl" theme="dark" background="#1e1b4b">
    <h2>The same, right to left</h2>
    <Ranger :stops="moods" aria-label="RTL" />
  </ExampleCard>
</template>
