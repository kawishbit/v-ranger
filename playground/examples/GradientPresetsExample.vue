<script setup lang="ts">
import { Ranger } from '../../src/index'
import { moods, presets } from '../data'
</script>

<template>
  <section>
    <h2>Gradient presets</h2>
    <div v-for="name in presets" :key="name">
      <p>
        <code>{{ name }}</code>
      </p>
      <Ranger :stops="moods" :gradient="name" :aria-label="name" />
    </div>
  </section>
</template>
