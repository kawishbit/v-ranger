<script setup lang="ts">
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import { moods, sizes } from '../data'
import source from './SizesExample.vue?raw'
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="dark" background="#052e16">
    <h2>The three sizes</h2>
    <p>Geometry only, so the colour is the same at every one</p>
    <div v-for="size in sizes" :key="size">
      <p>
        <code>size="{{ size }}"</code>
      </p>
      <Ranger :stops="moods" :size="size" model-value="wow" :aria-label="size" />
    </div>
  </ExampleCard>
</template>
