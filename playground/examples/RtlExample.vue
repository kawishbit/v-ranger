<script setup lang="ts">
import { Ranger } from '../../src/index'
import { moods } from '../data'
</script>

<template>
  <section dir="rtl">
    <h2>The same, right to left</h2>
    <Ranger :stops="moods" aria-label="RTL" />
  </section>
</template>
