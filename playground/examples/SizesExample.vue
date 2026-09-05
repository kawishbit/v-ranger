<script setup lang="ts">
import { Ranger } from '../../src/index'
import { moods, sizes } from '../data'
</script>

<template>
  <section>
    <h2>The three sizes</h2>
    <p>Geometry only, so the colour is the same at every one</p>
    <div v-for="size in sizes" :key="size">
      <p>
        <code>size="{{ size }}"</code>
      </p>
      <Ranger :stops="moods" :size="size" model-value="wow" :aria-label="size" />
    </div>
  </section>
</template>
