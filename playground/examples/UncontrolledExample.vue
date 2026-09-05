<script setup lang="ts">
import { ref } from 'vue'
import { Ranger } from '../../src/index'
import CodeBlock from '../CodeBlock.vue'
import ExampleCard from '../ExampleCard.vue'
import source from './UncontrolledExample.vue?raw'

const letter = ref('a')
</script>

<template>
  <CodeBlock :code="source" />
  <ExampleCard theme="dark" background="#171717">
    <h2>A starting value, and disabled stops</h2>
    <div class="label-overhang-guard">
      <Ranger
        v-model="letter"
        :stops="[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B', disabled: true },
          { value: 'c', label: 'C' },
        ]"
        aria-label="Letters"
      />
    </div>
  </ExampleCard>
</template>
