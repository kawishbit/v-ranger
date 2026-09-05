<script setup lang="ts">
import { Ranger } from '../../src/index'
import ExampleCard from '../ExampleCard.vue'
import { moods, presets } from '../data'
</script>

<template>
  <ExampleCard theme="dark" background="#3b0764">
    <h2>Gradient presets</h2>
    <div v-for="name in presets" :key="name">
      <p>
        <code>{{ name }}</code>
      </p>
      <Ranger :stops="moods" :gradient="name" :aria-label="name" />
    </div>
  </ExampleCard>
</template>
